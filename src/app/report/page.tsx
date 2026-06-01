"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Camera, Film, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { MiniMapPickerDynamic } from "@/components/map/MiniMapPickerDynamic";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RiskLevel } from "@/types";

const DEFAULT_LAT = 43.0096;
const DEFAULT_LNG = -81.2742;

type Analysis = {
    gooseCount: number;
    isNesting: boolean;
    isAggressive: boolean;
    riskLevel: RiskLevel;
    summary: string;
};

const whatHappensNext = [
    {
        title: "Claude Vision analysis",
        detail:
            "Wingman AI scans your photo, counts every goose in frame, and returns a count with confidence scoring.",
    },
    {
        title: "Severity assessment",
        detail:
            "Goose count and campus location are combined to assign a risk level: low, moderate, or high. High counts near known nesting zones escalate automatically.",
    },
    {
        title: "Behavioural intelligence",
        detail:
            "A second AI pass analyses the frame for goslings, nesting posture, spread wings, and lowered-neck aggression signals — the cues that matter most for safety.",
    },
    {
        title: "Live campus hotspot",
        detail:
            "Approved sightings appear as real-time markers on the Western campus map, visible to any Mustang checking routes before they walk.",
    },
];

export default function ReportPage() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [gooseCount, setGooseCount] = useState(1);
    const [lat, setLat] = useState(DEFAULT_LAT);
    const [lng, setLng] = useState(DEFAULT_LNG);
    const [description, setDescription] = useState("");
    const [locationName, setLocationName] = useState("");
    const [reporterName, setReporterName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const analyzeFile = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1];
            setImagePreview(dataUrl);
            setLoading(true);
            setAnalysis(null);
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
                });
                const data = (await res.json()) as Analysis & { error?: unknown };
                if (!res.ok) {
                    toast.error("Could not analyze image", {
                        description:
                            typeof data.error === "string"
                                ? data.error
                                : "Check your API key and try again.",
                    });
                    return;
                }
                setAnalysis(data);
                setGooseCount(Math.max(1, data.gooseCount || 1));
            } catch {
                toast.error("Analysis request failed");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const handleImage = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) analyzeFile(file);
        },
        [analyzeFile]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) analyzeFile(file);
        },
        [analyzeFile]
    );

    const useMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported in this browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                toast.success("Location updated");
            },
            () => toast.error("Could not read your location")
        );
    }, []);

    const handlePick = useCallback((nextLat: number, nextLng: number) => {
        setLat(nextLat);
        setLng(nextLng);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/sightings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lat,
                    lng,
                    gooseCount,
                    isNesting: analysis?.isNesting ?? false,
                    isAggressive: analysis?.isAggressive ?? false,
                    description: description || undefined,
                    aiSummary: analysis?.summary,
                    locationName: locationName || undefined,
                    reporterName: reporterName || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error("Could not save sighting", {
                    description:
                        typeof err.error === "string" ? err.error : "Try again later.",
                });
                return;
            }
            toast.success("Sighting reported — stay safe out there, Mustang.");
            setImagePreview(null);
            setAnalysis(null);
            setDescription("");
            setLocationName("");
        } catch {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-dvh flex-col bg-western-purple-faint pb-24 md:pb-8">
            <Header />

            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 md:py-14">

                {/* Page header */}
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/70">
                        AI Analysis
                    </p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-black md:text-5xl">
                        Report a Sighting
                    </h1>
                    <p className="mt-3 max-w-lg text-black/60">
                        Upload a photo of geese on campus. Wingman AI counts them, checks
                        for goslings and nesting behaviour, and assigns a live risk level.
                        Approved sightings feed into the Western campus map.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Mode tabs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 rounded-2xl border border-western-purple/25 bg-white px-4 py-3 shadow-sm">
                            <div className="flex size-9 items-center justify-center rounded-full bg-western-purple text-white">
                                <Camera className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-western-purple">Photo</p>
                                <p className="text-xs text-black/50">Count geese in a single frame</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-western-purple/10 bg-white/50 px-4 py-3 opacity-50">
                            <div className="flex size-9 items-center justify-center rounded-full bg-western-purple/10 text-western-purple/40">
                                <Film className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-black/50">Video</p>
                                <p className="flex items-center gap-1.5 text-xs text-black/40">
                                    Coming soon
                                    <span className="rounded-full bg-western-purple/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-western-purple/50">
                                        Soon
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            "relative rounded-3xl border-2 border-dashed hover:border-western-purple transition-colors",
                            dragging
                                ? "border-western-purple bg-western-purple/10"
                                : "border-western-purple/20 bg-white/60"
                        )}
                    >
                        {imagePreview ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview}
                                    alt=""
                                    className="max-h-72 w-full rounded-3xl object-cover"
                                />
                                <label
                                    htmlFor="photo"
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                                >
                                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                                        Replace photo
                                    </span>
                                </label>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                                <div className="flex size-14 items-center justify-center rounded-full bg-western-purple/10 text-western-purple/50">
                                    <Upload className="size-6" />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-black">
                                        Drop a photo here
                                    </p>
                                    <p className="mt-1 text-sm text-black/45">
                                        JPG, PNG · Max 20 MB
                                    </p>
                                </div>
                                <label
                                    htmlFor="photo"
                                    className="cursor-pointer rounded-full bg-western-purple px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-western-purple-dark"
                                >
                                    Choose photo
                                </label>
                            </div>
                        )}
                        <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={handleImage}
                        />
                    </div>

                    {/* AI loading state */}
                    {loading && (
                        <div className="flex items-center gap-3 rounded-2xl border border-western-purple/20 bg-white px-5 py-4">
                            <div className="size-2 animate-pulse rounded-full bg-western-purple" />
                            <p className="text-sm text-western-purple">Wingman AI is analysing your photo…</p>
                        </div>
                    )}

                    {/* AI result card */}
                    {analysis && !loading && (
                        <div className="rounded-2xl border border-western-purple/20 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-black">{analysis.summary}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-western-purple-faint px-3 py-1 text-sm font-semibold text-western-purple">
                                    {gooseCount} {gooseCount === 1 ? "goose" : "geese"}
                                </span>
                                <RiskBadge level={analysis.riskLevel} />
                                {analysis.isNesting && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                        Nesting
                                    </span>
                                )}
                                {analysis.isAggressive && (
                                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                        Aggressive
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <Label htmlFor="count" className="text-xs font-medium text-black/50">
                                    Adjust count if needed
                                </Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={gooseCount}
                                    onChange={(e) => setGooseCount(Number.parseInt(e.target.value, 10) || 1)}
                                    className="h-8 w-20 border-western-purple/30 bg-western-purple-faint text-center text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* What happens next — shown before analysis */}
                    {!analysis && !loading && (
                        <div className="rounded-2xl border border-western-purple/15 bg-white/70 p-5">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/60">
                                What happens next
                            </p>
                            <ol className="space-y-5">
                                {whatHappensNext.map((step, i) => (
                                    <li key={step.title} className="flex gap-4">
                                        <span className="mt-0.5 shrink-0 text-xs font-semibold text-western-purple/40">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-black">{step.title}</p>
                                            <p className="mt-1 text-sm text-black/55">{step.detail}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Location */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-western-purple">Location</p>
                                <p className="text-xs text-black/50">Tap the map to drop a pin, or use GPS.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={useMyLocation}
                                className="border-western-purple/30 bg-white text-western-purple hover:bg-western-purple-faint"
                            >
                                Use my location
                            </Button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-western-purple/20 bg-white">
                            <MiniMapPickerDynamic lat={lat} lng={lng} onPick={handlePick} />
                        </div>
                        <p className="font-mono text-xs text-western-purple/50">
                            {lat.toFixed(5)},&nbsp; {lng.toFixed(5)}
                        </p>
                    </div>

                    {/* Optional fields */}
                    <div className="space-y-5 rounded-2xl border border-western-purple/15 bg-white/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/60">
                            Optional details
                        </p>
                        <div className="space-y-1.5">
                            <Label htmlFor="where" className="text-sm font-semibold text-western-purple">
                                Place name
                            </Label>
                            <Input
                                id="where"
                                placeholder="e.g. UC Hill, Middlesex College, Thames path"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                className="border-western-purple/30 bg-white focus-visible:ring-western-purple"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="who" className="text-sm font-semibold text-western-purple">
                                Your name
                            </Label>
                            <Input
                                id="who"
                                placeholder="Anonymous"
                                value={reporterName}
                                onChange={(e) => setReporterName(e.target.value)}
                                className="border-western-purple/30 bg-white focus-visible:ring-western-purple"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="desc" className="text-sm font-semibold text-western-purple">
                                Notes
                            </Label>
                            <Textarea
                                id="desc"
                                rows={3}
                                maxLength={500}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-western-purple/30 bg-white focus-visible:ring-western-purple"
                                placeholder="Anything else Mustangs should know?"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-western-purple px-6 py-3 font-semibold text-white transition hover:bg-western-purple-dark"
                        >
                            {submitting ? "Submitting…" : "Submit sighting"}
                        </Button>
                        <Link
                            href="/map"
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "rounded-full border-western-purple/30 px-6 py-3 font-semibold text-western-purple hover:bg-western-purple-faint"
                            )}
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>

            <MobileNav />
        </div>
    );
}
