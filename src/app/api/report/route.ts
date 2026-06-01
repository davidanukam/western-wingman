import { NextResponse } from "next/server";
import { z } from "zod";
import { generateApprovalToken } from "@/lib/approval-token";
import { sendPendingApprovalEmail } from "@/lib/email";
import {
  analyzeGooseBehavior,
  defaultBehaviorAnalysis,
  isGeminiConfigured,
} from "@/lib/gemini";
import { detectGeese, isRoboflowConfigured } from "@/lib/roboflow";
import { computeRiskLevel } from "@/lib/sightings";
import { isAllowedImageMediaType, normalizeImageMediaType } from "@/lib/media";
import { createServiceSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";

const ReportSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  gooseCount: z.number().int().min(0).max(500).optional(),
  detectionConfidence: z.number().min(0).max(1).nullable().optional(),
  isNesting: z.boolean().optional(),
  isAggressive: z.boolean().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  description: z.string().max(500).optional(),
  aiSummary: z.string().max(500).optional(),
  locationName: z.string().max(200).optional(),
  reporterName: z.string().max(100).optional(),
});

function extensionForMediaType(mediaType: string): string {
  switch (mediaType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    if (!isRoboflowConfigured()) {
      return NextResponse.json(
        { error: "ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID are not configured" },
        { status: 503 }
      );
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client unavailable" }, { status: 503 });
    }

    const body = ReportSchema.parse(await req.json());
    if (!isAllowedImageMediaType(body.mediaType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    const mediaType = normalizeImageMediaType(body.mediaType);
    const { imageBase64 } = body;

    const detection = await detectGeese(imageBase64);
    const gooseCount = body.gooseCount ?? detection.gooseCount;
    const detectionConfidence =
      body.detectionConfidence ?? detection.detectionConfidence;

    let isNesting = body.isNesting ?? false;
    let isAggressive = body.isAggressive ?? false;
    let riskLevel = body.riskLevel;
    let aiSummary = body.aiSummary;

    if (isGeminiConfigured() && (!body.isNesting && !body.isAggressive && !aiSummary)) {
      try {
        const behavior = await analyzeGooseBehavior(
          imageBase64,
          mediaType,
          gooseCount,
          detectionConfidence
        );
        isNesting = behavior.isNesting;
        isAggressive = behavior.isAggressive;
        riskLevel = behavior.riskLevel;
        aiSummary = behavior.summary;
      } catch (e) {
        console.error("Gemini on report:", e);
      }
    }

    if (!riskLevel) {
      riskLevel = computeRiskLevel(isAggressive, isNesting, gooseCount);
    }
    if (!aiSummary) {
      aiSummary = defaultBehaviorAnalysis(gooseCount, isNesting, isAggressive).summary;
    }

    const submissionId = crypto.randomUUID();
    const ext = extensionForMediaType(mediaType);
    const imagePath = `${submissionId}.${ext}`;
    const imageBuffer = Buffer.from(imageBase64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("sightings-pending")
      .upload(imagePath, imageBuffer, {
        contentType: mediaType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      const hint =
        uploadError.message?.includes("Bucket not found") ||
        uploadError.message?.includes("not found")
          ? " Run: npm run setup:storage (or create bucket sightings-pending in Supabase Dashboard → Storage)."
          : "";
      return NextResponse.json(
        {
          error: `Failed to upload image: ${uploadError.message}.${hint}`,
        },
        { status: 500 }
      );
    }

    const { token, hash } = generateApprovalToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("pending_submissions").insert({
      id: submissionId,
      status: "pending",
      lat: body.lat,
      lng: body.lng,
      goose_count: gooseCount,
      detection_confidence: detectionConfidence,
      detection_payload: detection.detectionPayload,
      is_nesting: isNesting,
      is_aggressive: isAggressive,
      risk_level: riskLevel,
      description: body.description ?? null,
      image_path: imagePath,
      ai_summary: aiSummary,
      reporter_name: body.reporterName ?? "Anonymous",
      location_name: body.locationName ?? null,
      approve_token_hash: hash,
      token_expires_at: expiresAt,
    });

    if (insertError) {
      console.error("pending_submissions insert:", insertError);
      const hint =
        insertError.code === "PGRST205" || insertError.message?.includes("schema cache")
          ? " Run: npm run setup:db"
          : "";
      return NextResponse.json(
        { error: `Failed to save pending report: ${insertError.message}.${hint}` },
        { status: 500 }
      );
    }

    const { data: signed } = await supabase.storage
      .from("sightings-pending")
      .createSignedUrl(imagePath, 60 * 60 * 24);

    const emailResult = await sendPendingApprovalEmail({
      submissionId,
      approveToken: token,
      gooseCount,
      detectionConfidence,
      lat: body.lat,
      lng: body.lng,
      locationName: body.locationName,
      isNesting,
      isAggressive,
      riskLevel,
      aiSummary,
      imagePreviewUrl: signed?.signedUrl ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
        pendingId: submissionId,
        emailSent: emailResult.sent,
        devLinks: emailResult.devLinks,
        message:
          "Report sent for review — it will appear on the map once approved.",
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
