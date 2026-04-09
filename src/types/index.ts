export type RiskLevel = "low" | "medium" | "high";

export type Sighting = {
  id: string;
  createdAt: string;
  lat: number;
  lng: number;
  gooseCount: number;
  isNesting: boolean;
  isAggressive: boolean;
  riskLevel: RiskLevel;
  description: string | null;
  imageUrl: string | null;
  aiSummary: string | null;
  reporterName: string | null;
  locationName: string | null;
  upvotes: number;
};
