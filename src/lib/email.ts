import { Resend } from "resend";

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.APPROVER_EMAIL
  );
}

type PendingReportEmail = {
  submissionId: string;
  approveToken: string;
  gooseCount: number;
  detectionConfidence: number | null;
  lat: number;
  lng: number;
  locationName?: string | null;
  isNesting: boolean;
  isAggressive: boolean;
  riskLevel: string;
  aiSummary?: string | null;
  imagePreviewUrl?: string | null;
};

export async function sendPendingApprovalEmail(
  data: PendingReportEmail
): Promise<{ sent: boolean; devLinks?: { approve: string; reject: string } }> {
  const base = getAppBaseUrl();
  const approveUrl = `${base}/api/approve?token=${encodeURIComponent(data.approveToken)}&action=approve`;
  const rejectUrl = `${base}/api/approve?token=${encodeURIComponent(data.approveToken)}&action=reject`;

  const confPct =
    data.detectionConfidence != null
      ? `${Math.round(data.detectionConfidence * 100)}%`
      : "n/a";

  const html = `
    <h2>New goose sighting pending approval</h2>
    <p><strong>Count:</strong> ${data.gooseCount} geese (YOLO confidence: ${confPct})</p>
    <p><strong>Risk:</strong> ${data.riskLevel}</p>
    <p><strong>Location:</strong> ${data.locationName ?? `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`}</p>
    <p><strong>Nesting:</strong> ${data.isNesting ? "Yes" : "No"} · <strong>Aggressive:</strong> ${data.isAggressive ? "Yes" : "No"}</p>
    ${data.aiSummary ? `<p><strong>Summary:</strong> ${data.aiSummary}</p>` : ""}
    ${data.imagePreviewUrl ? `<p><a href="${data.imagePreviewUrl}">View photo</a></p>` : ""}
    <p>
      <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#4f2683;color:#fff;text-decoration:none;border-radius:8px;margin-right:8px;">Approve</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:10px 16px;background:#666;color:#fff;text-decoration:none;border-radius:8px;">Reject</a>
    </p>
    <p style="color:#888;font-size:12px;">Submission ID: ${data.submissionId}</p>
  `;

  if (!isEmailConfigured()) {
    console.info("[email] Resend not configured — approval links:", { approveUrl, rejectUrl });
    return { sent: false, devLinks: { approve: approveUrl, reject: rejectUrl } };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.APPROVER_EMAIL!,
    subject: `[Western Wingman] ${data.gooseCount} geese — approval needed`,
    html,
  });

  return { sent: true };
}
