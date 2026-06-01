"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { Box, List, Shield, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { GooseMapDynamic } from "@/components/map/GooseMapDynamic";
import { Header } from "@/components/layout/Header";
import { LiveCounter } from "@/components/ui/LiveCounter";
import { ReportButton } from "@/components/ui/ReportButton";
import { SightingListRow } from "@/components/ui/SightingListRow";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSightings } from "@/hooks/useSightings";
import { cn } from "@/lib/utils";
import type { Sighting } from "@/types";

type FilterTab = "all" | "hotspots" | "nesting";

function filterSightings(list: Sighting[], tab: FilterTab): Sighting[] {
    if (tab === "hotspots") {
        return list.filter((s) => s.riskLevel === "high" || s.gooseCount >= 5);
    }
    if (tab === "nesting") {
        return list.filter((s) => s.isNesting);
    }
    return list;
}

function RiskAlertCards({ sightings }: { sightings: Sighting[] }) {
    const alerts = useMemo(() => {
        const high = sightings.filter((s) => s.riskLevel === "high").slice(0, 4);
        const nesting = sightings.filter((s) => s.isNesting && s.riskLevel !== "high").slice(0, 2);
        const combined = [...high, ...nesting].slice(0, 5);
        return combined;
    }, [sightings]);

    if (alerts.length === 0) {
        return (
            <div className="border-b border-black/6 px-4 py-3 text-sm text-neutral-500">
                No active nesting or aggression alerts.
            </div>
        );
    }

    return (
        <div className="space-y-2 border-b border-black/6 px-4 py-3">
            {alerts.map((s) => (
                <div
                    key={s.id}
                    className="flex gap-3 rounded-xl border border-western-purple/15 bg-western-purple-faint/45 px-3 py-2.5 shadow-sm"
                >
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-western-purple" aria-hidden />
                    <div className="min-w-0">
                        <p className="font-bold text-neutral-900">{s.locationName ?? "Campus"}</p>
                        <p className="text-sm leading-snug text-neutral-700">
                            {s.riskLevel === "high"
                                ? s.aiSummary ?? "High-risk goose activity reported — give the area space."
                                : s.aiSummary ?? "Nesting activity possible — keep dogs leashed and stay on paths."}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FilterTabs({
    value,
    onChange,
    sightings,
}: {
    value: FilterTab;
    onChange: (t: FilterTab) => void;
    sightings: Sighting[];
}) {
    const tabs: { id: FilterTab; label: string }[] = [
        { id: "all", label: "All" },
        { id: "hotspots", label: "Hotspots" },
        { id: "nesting", label: "Nesting" },
    ];

    return (
        <div className="flex gap-2 border-b border-black/6 px-4 py-3">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange(t.id)}
                    className={cn(
                        "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                        value === t.id
                            ? "bg-western-purple text-white shadow-sm"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
                    )}
                >
                    {t.label}
                    <span className="text-[10px] font-medium opacity-75">{sightings.length}</span>
                </button>
            ))}
        </div>
    );
}

function CampusPanel({
    sightings,
    filter,
    onFilterChange,
    className,
}: {
    sightings: Sighting[];
    filter: FilterTab;
    onFilterChange: (t: FilterTab) => void;
    className?: string;
}) {
    const filtered = useMemo(() => filterSightings(sightings, filter), [sightings, filter]);

    return (
        <div className={cn("flex min-h-0 flex-col bg-white", className)}>
            <LiveCounter sightings={sightings} />
            <RiskAlertCards sightings={sightings} />
            <FilterTabs value={filter} onChange={onFilterChange} sightings={sightings} />
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {filtered.length === 0 ? (
                    <p className="px-1 py-4 text-center text-sm text-neutral-500">No sightings in this view.</p>
                ) : (
                    filtered.map((s) => <SightingListRow key={s.id} sighting={s} />)
                )}
            </div>
        </div>
    );
}

function SafeRouteButton({ className }: { className?: string }) {
    return (
        <Button
            type="button"
            variant="secondary"
            className={cn(
                "rounded-full border border-black/10 bg-white font-semibold text-neutral-800 shadow-md hover:border-western-purple/30 hover:text-western-purple hover:bg-white",
                className
            )}
            onClick={() =>
                toast.message("Safe route", { description: "Routing around hotspots is coming soon." })
            }
        >
            <Shield className="mr-1.5 size-4 text-neutral-600" aria-hidden />
            Safe route
        </Button>
    );
}

function Map3DButton({
    className,
    mapRef,
}: {
    className?: string;
    mapRef: React.MutableRefObject<maplibregl.Map | null>;
}) {
    const [tilted, setTilted] = useState(false);

    const toggle = useCallback(() => {
        const m = mapRef.current;
        if (!m) {
            toast.message("Map still loading");
            return;
        }
        const next = !tilted;
        setTilted(next);
        m.easeTo({ pitch: next ? 52 : 0, bearing: next ? -25 : 0, duration: 650 });
    }, [tilted, mapRef]);

    return (
        <Button
            type="button"
            variant="secondary"
            className={cn(
                "rounded-full border border-black/10 bg-white px-3 font-bold text-neutral-700 shadow-md hover:border-western-purple/30 hover:text-western-purple hover:bg-white",
                className
            )}
            onClick={toggle}
            aria-pressed={tilted}
        >
            <Box className="mr-1 size-4" aria-hidden />
            {tilted ? "2D" : "3D"}
        </Button>
    );
}

export function MapPageClient() {
    const { sightings } = useSightings();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [filter, setFilter] = useState<FilterTab>("all");
    const mapRef = useRef<maplibregl.Map | null>(null);

    const handleMapReady = useCallback((map: maplibregl.Map) => {
        mapRef.current = map;
    }, []);

    return (
        <div className="relative flex h-dvh flex-col overflow-hidden bg-western-purple-faint">

            <Header />

            <div className="relative z-10 min-h-0 flex-1">
                <GooseMapDynamic sightings={sightings} onMapReady={handleMapReady} />

                {/* Floating right panel - desktop */}
                <aside
                    className="pointer-events-auto absolute top-3 right-5 bottom-10 z-20 hidden w-[min(290px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_48px_rgba(0,0,0,0.14)] md:flex"
                    aria-label="Live campus map panel"
                >
                    <CampusPanel sightings={sightings} filter={filter} onFilterChange={setFilter} />
                </aside>

                {/* Bottom floating controls - mobile */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:bottom-6 md:gap-3 md:pb-6">
                    <Button
                        type="button"
                        variant="secondary"
                        className="pointer-events-auto rounded-full border border-black/10 bg-white px-5 py-2.5 font-semibold text-neutral-900 shadow-lg backdrop-blur-sm md:hidden"
                        onClick={() => setSheetOpen(true)}
                    >
                        <List className="mr-2 size-4 shrink-0" aria-hidden />
                        Sightings
                    </Button>
                    <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 md:gap-3">
                        <ReportButton className="h-12 shrink-0 rounded-full bg-black px-5 text-base text-white shadow-lg hover:bg-western-purple sm:px-6" />
                        <SafeRouteButton className="h-12 shrink-0 rounded-full px-4 sm:px-5" />
                        <Map3DButton mapRef={mapRef} className="h-12 shrink-0" />
                    </div>
                </div>

                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="bottom" className="flex max-h-[78vh] flex-col gap-0 rounded-t-2xl p-0">
                        <SheetHeader className="border-b border-black/6 px-4 py-3 text-left">
                            <SheetTitle className="text-western-purple">Live Campus Map</SheetTitle>
                        </SheetHeader>
                        <CampusPanel
                            className="min-h-0 flex-1"
                            sightings={sightings}
                            filter={filter}
                            onFilterChange={setFilter}
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
