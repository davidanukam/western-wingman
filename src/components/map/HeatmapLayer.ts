import type { Sighting } from "@/types";

export function buildSightingsGeoJSON(sightings: Sighting[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: sightings
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
        properties: {
          weight: s.gooseCount,
          risk: s.riskLevel === "high" ? 1 : s.riskLevel === "medium" ? 0.5 : 0.2,
          id: s.id,
          riskLevel: s.riskLevel,
        },
      })),
  };
}

/** Heatmap: purple wash into strong red danger cores (waddleloo-style blobs) */
export const heatmapPaint = {
  "heatmap-weight": ["*", 1.2, ["get", "risk"]],
  "heatmap-radius": 52,
  "heatmap-intensity": 1.1,
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(79,38,131,0)",
    0.15,
    "rgba(239,68,68,0.15)",
    0.45,
    "rgba(239,68,68,0.45)",
    0.75,
    "rgba(220,38,38,0.65)",
    1,
    "rgba(185,28,28,0.85)",
  ],
};
