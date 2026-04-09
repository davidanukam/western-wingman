import type { Sighting } from "@/types";

function gooseRange(total: number): string {
  if (total <= 0) return "—";
  const low = Math.max(1, Math.floor(total * 0.85));
  const high = Math.max(low + 1, Math.ceil(total * 1.15));
  return `${low}–${high}`;
}

export function LiveCounter({ sightings }: { sightings: Sighting[] }) {
  const total = sightings.reduce((sum, s) => sum + s.gooseCount, 0);
  const high = sightings.filter((s) => s.riskLevel === "high").length;

  return (
    <div className="border-b border-black/[0.06] p-4 md:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#10b981]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
        </span>
        Live Campus Map
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-neutral-900 md:text-[2.75rem] md:leading-none">
          {gooseRange(total)}
        </span>
        <span className="mb-1.5 text-sm font-medium text-neutral-500">geese on campus</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-neutral-500">{sightings.length} sightings</span>
        <span className="font-semibold text-[#ef4444]">{high} high risk</span>
      </div>
    </div>
  );
}
