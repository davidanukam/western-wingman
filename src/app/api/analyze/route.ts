import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeGooseBehavior,
  defaultBehaviorAnalysis,
  isGeminiConfigured,
} from "@/lib/gemini";
import { detectGeese, isRoboflowConfigured } from "@/lib/roboflow";
import { isAllowedImageMediaType, normalizeImageMediaType } from "@/lib/media";
import { computeRiskLevel } from "@/lib/sightings";

const BodySchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.string().min(1),
});

const AnalysisSchema = z.object({
  gooseCount: z.number().int().min(0).max(500),
  detectionConfidence: z.number().min(0).max(1).nullable(),
  isNesting: z.boolean(),
  isAggressive: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string().max(200),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { imageBase64, mediaType: rawMediaType } = BodySchema.parse(json);
    if (!isAllowedImageMediaType(rawMediaType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    const mediaType = normalizeImageMediaType(rawMediaType);

    if (!isRoboflowConfigured()) {
      return NextResponse.json(
        { error: "ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID are not configured" },
        { status: 503 }
      );
    }

    const detection = await detectGeese(imageBase64);
    const gooseCount = detection.gooseCount;

    let behavior;
    if (isGeminiConfigured()) {
      try {
        behavior = await analyzeGooseBehavior(
          imageBase64,
          mediaType,
          gooseCount,
          detection.detectionConfidence
        );
      } catch (e) {
        console.error("Gemini behavior analysis failed:", e);
        behavior = defaultBehaviorAnalysis(gooseCount);
      }
    } else {
      behavior = defaultBehaviorAnalysis(gooseCount);
    }

    const riskLevel =
      behavior.riskLevel ??
      computeRiskLevel(behavior.isAggressive, behavior.isNesting, gooseCount);

    const result = AnalysisSchema.parse({
      gooseCount,
      detectionConfidence: detection.detectionConfidence,
      isNesting: behavior.isNesting,
      isAggressive: behavior.isAggressive,
      riskLevel,
      summary: behavior.summary,
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
