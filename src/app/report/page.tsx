"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
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

export default function ReportPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [gooseCount, setGooseCount] = useState(1);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            description: typeof data.error === "string" ? data.error : "Check your API key and try again.",
          });
          return;
        }
        setAnalysis({
          gooseCount: data.gooseCount,
          isNesting: data.isNesting,
          isAggressive: data.isAggressive,
          riskLevel: data.riskLevel,
          summary: data.summary,
        });
        setGooseCount(Math.max(1, data.gooseCount || 1));
      } catch {
        toast.error("Analysis request failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
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
          description: typeof err.error === "string" ? err.error : "Try again later.",
        });
        return;
      }
      toast.success("Sighting reported — stay safe out there.");
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
    <div className="flex min-h-[100dvh] flex-col bg-western-purple-faint pb-24 md:pb-8">
      <Header />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-western-purple">Report a sighting</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a photo for AI-assisted counts, then confirm location on the map.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div>
            <Label htmlFor="photo" className="text-western-purple">
              Photo
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-2 cursor-pointer border-western-purple/30 bg-card"
              onChange={handleImage}
            />
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt=""
                className="mt-4 max-h-64 w-full rounded-xl border border-border object-cover"
              />
            ) : null}
            {loading ? <p className="mt-2 text-sm text-muted-foreground">Analyzing image…</p> : null}
            {analysis ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-medium text-foreground">{analysis.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-western-purple-faint px-3 py-1 text-sm font-semibold text-western-purple">
                    {gooseCount} geese
                  </span>
                  <RiskBadge level={analysis.riskLevel} />
                  {analysis.isNesting ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Nesting
                    </span>
                  ) : null}
                  {analysis.isAggressive ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                      Aggressive
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="count" className="text-western-purple">
              Goose count
            </Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={500}
              value={gooseCount}
              onChange={(e) => setGooseCount(Number.parseInt(e.target.value, 10) || 1)}
              className="mt-2 border-western-purple/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-western-purple">Location</Label>
              <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
                Use my location
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the map to drop a pin, or use GPS.
            </p>
            <div className="mt-3">
              <MiniMapPickerDynamic lat={lat} lng={lng} onPick={handlePick} />
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>

          <div>
            <Label htmlFor="where" className="text-western-purple">
              Place name (optional)
            </Label>
            <Input
              id="where"
              placeholder="e.g. UC Hill, Natural Sciences"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-2 border-western-purple/30"
            />
          </div>

          <div>
            <Label htmlFor="who" className="text-western-purple">
              Your name (optional)
            </Label>
            <Input
              id="who"
              placeholder="Anonymous"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="mt-2 border-western-purple/30"
            />
          </div>

          <div>
            <Label htmlFor="desc" className="text-western-purple">
              Notes (optional)
            </Label>
            <Textarea
              id="desc"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 border-western-purple/30"
              placeholder="Anything else walkers should know?"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-western-purple text-primary-foreground hover:bg-western-purple-dark"
            >
              {submitting ? "Submitting…" : "Submit sighting"}
            </Button>
            <Link
              href="/map"
              className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center justify-center")}
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
