import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const colors: Record<RiskLevel, string> = {
  high: "border border-red-200 bg-red-100 text-red-700",
  medium: "border border-amber-200 bg-amber-100 text-amber-700",
  low: "border border-green-200 bg-green-100 text-green-700",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const label =
    level === "high" ? "High risk" : level === "medium" ? "Medium risk" : "Low risk";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[level])}>
      {label}
    </span>
  );
}
