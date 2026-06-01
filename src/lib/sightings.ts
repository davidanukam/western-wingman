import type { RiskLevel, Sighting } from "@/types";

export type SightingRow = {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  goose_count: number;
  detection_confidence: number | null;
  is_nesting: boolean;
  is_aggressive: boolean;
  risk_level: string;
  description: string | null;
  image_url: string | null;
  ai_summary: string | null;
  reporter_name: string | null;
  location_name: string | null;
  upvotes: number;
};

export function mapSightingRow(row: SightingRow | Record<string, unknown>): Sighting {
  const r = row as SightingRow;
  return {
    id: r.id,
    createdAt:
      typeof r.created_at === "string"
        ? r.created_at
        : new Date(r.created_at as string).toISOString(),
    lat: Number(r.lat),
    lng: Number(r.lng),
    gooseCount: Number(r.goose_count),
    detectionConfidence:
      r.detection_confidence != null ? Number(r.detection_confidence) : null,
    isNesting: Boolean(r.is_nesting),
    isAggressive: Boolean(r.is_aggressive),
    riskLevel: (r.risk_level as RiskLevel) ?? "low",
    description: r.description ?? null,
    imageUrl: r.image_url ?? null,
    aiSummary: r.ai_summary ?? null,
    reporterName: r.reporter_name ?? null,
    locationName: r.location_name ?? null,
    upvotes: Number(r.upvotes ?? 0),
  };
}

export function computeRiskLevel(
  isAggressive: boolean,
  isNesting: boolean,
  gooseCount: number
): RiskLevel {
  if (isAggressive) return "high";
  if (isNesting) return "medium";
  if (gooseCount >= 5) return "high";
  if (gooseCount >= 3) return "medium";
  return "low";
}
