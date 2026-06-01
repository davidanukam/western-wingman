import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

export function generateApprovalToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const hash = hashApprovalToken(token);
  return { token, hash };
}

export function hashApprovalToken(token: string): string {
  const secret = process.env.APPROVAL_TOKEN_SECRET ?? "dev-insecure-change-me";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export function verifyApprovalToken(token: string, storedHash: string): boolean {
  const computed = hashApprovalToken(token);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
