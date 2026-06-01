const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function normalizeImageMediaType(type: string): string {
  if (type === "image/jpg") return "image/jpeg";
  if (ALLOWED.has(type)) return type;
  return "image/jpeg";
}

export function isAllowedImageMediaType(type: string): boolean {
  return ALLOWED.has(normalizeImageMediaType(type));
}
