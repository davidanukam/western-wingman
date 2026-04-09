import type { Sighting } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/relativeTime";

function riskLabel(level: Sighting["riskLevel"]): string {
  if (level === "high") return "High risk";
  if (level === "medium") return "Medium risk";
  return "Low risk";
}

function riskTextClass(level: Sighting["riskLevel"]): string {
  if (level === "high") return "text-[#ef4444]";
  if (level === "medium") return "text-[#f59e0b]";
  return "text-[#10b981]";
}

export function SightingListRow({ sighting, className }: { sighting: Sighting; className?: string }) {
  const title = sighting.locationName?.trim() || "Campus sighting";

  return (
    <div
      className={cn(
        "flex gap-3 border-b border-black/[0.06] bg-white py-3 pl-1 pr-2 last:border-b-0",
        sighting.riskLevel === "high" && "border-l-[3px] border-l-[#ef4444]",
        sighting.riskLevel !== "high" && "border-l-[3px] border-l-transparent",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className={cn("text-xs font-semibold", riskTextClass(sighting.riskLevel))}>{riskLabel(sighting.riskLevel)}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{formatRelativeTime(sighting.createdAt)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-neutral-800">{sighting.gooseCount}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">geese</p>
      </div>
    </div>
  );
}
