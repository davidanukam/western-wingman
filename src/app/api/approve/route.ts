import { NextResponse } from "next/server";
import { hashApprovalToken } from "@/lib/approval-token";
import { createServiceSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";

function htmlPage(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem;"><h1>${title}</h1>${body}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return htmlPage(
      "Configuration error",
      "<p>Supabase is not configured on this server.</p>"
    );
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return htmlPage("Error", "<p>Could not connect to database.</p>");
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  if (!token || !action || !["approve", "reject"].includes(action)) {
    return htmlPage("Invalid link", "<p>Missing or invalid approval parameters.</p>");
  }

  const tokenHash = hashApprovalToken(token);
  const { data: pending, error: findError } = await supabase
    .from("pending_submissions")
    .select("*")
    .eq("approve_token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();

  if (findError || !pending) {
    return htmlPage(
      "Not found",
      "<p>Invalid or expired approval token.</p>"
    );
  }

  if (new Date(pending.token_expires_at as string) < new Date()) {
    return htmlPage("Expired", "<p>This approval link has expired.</p>");
  }

  if (action === "reject") {
    await supabase
      .from("pending_submissions")
      .update({ status: "rejected" })
      .eq("id", pending.id);

    return htmlPage(
      "Rejected",
      "<p>The sighting was rejected and will not appear on the map.</p><p><a href=\"/\">Return home</a></p>"
    );
  }

  const imagePath = pending.image_path as string;
  const ext = imagePath.includes(".") ? imagePath.split(".").pop() : "jpg";
  const approvedPath = `${pending.id}.${ext}`;

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("sightings-pending")
    .download(imagePath);

  if (downloadError || !fileData) {
    console.error(downloadError);
    return htmlPage("Error", "<p>Could not read pending image from storage.</p>");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const contentType = fileData.type || "image/jpeg";

  const { error: uploadApprovedError } = await supabase.storage
    .from("sightings-approved")
    .upload(approvedPath, buffer, { contentType, upsert: true });

  if (uploadApprovedError) {
    console.error(uploadApprovedError);
    return htmlPage(
      "Error",
      "<p>Could not publish image. Ensure bucket sightings-approved exists.</p>"
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("sightings-approved")
    .getPublicUrl(approvedPath);

  const { error: sightingError } = await supabase.from("sightings").insert({
    lat: pending.lat,
    lng: pending.lng,
    goose_count: pending.goose_count,
    detection_confidence: pending.detection_confidence,
    is_nesting: pending.is_nesting,
    is_aggressive: pending.is_aggressive,
    risk_level: pending.risk_level ?? "low",
    description: pending.description,
    image_url: publicUrlData.publicUrl,
    ai_summary: pending.ai_summary,
    reporter_name: pending.reporter_name ?? "Anonymous",
    location_name: pending.location_name,
  });

  if (sightingError) {
    console.error(sightingError);
    return htmlPage("Error", "<p>Failed to create approved sighting.</p>");
  }

  await supabase
    .from("pending_submissions")
    .update({ status: "approved" })
    .eq("id", pending.id);

  return htmlPage(
    "Approved",
    `<p>The sighting is now live on the <a href="/map">campus map</a>.</p><p><strong>${pending.goose_count}</strong> geese at ${pending.location_name ?? "campus"}.</p>`
  );
}
