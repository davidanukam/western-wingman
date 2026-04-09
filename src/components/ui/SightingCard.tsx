import type { Sighting } from "@/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SightingCard({ sighting, className }: { sighting: Sighting; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3 text-sm shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">
            {sighting.gooseCount} goose{sighting.gooseCount === 1 ? "" : "s"}
            {sighting.locationName ? ` · ${sighting.locationName}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{formatTime(sighting.createdAt)}</p>
        </div>
        <RiskBadge level={sighting.riskLevel} />
      </div>
      {sighting.aiSummary ? (
        <p className="mt-2 line-clamp-2 text-muted-foreground">{sighting.aiSummary}</p>
      ) : null}
    </div>
  );
}
