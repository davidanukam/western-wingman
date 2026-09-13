"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, MapPinned, Route, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { GooseMapDynamic } from "@/components/map/GooseMapDynamic";
import { GooseCarousel } from "@/components/ui/GooseCarousel";
import { SightingCard } from "@/components/ui/SightingCard";
import { useSightings } from "@/hooks/useSightings";

const steps = [
    {
        icon: Camera,
        title: "Spot aggressive geese",
        detail:
            "Encountered geese blocking your path near UC Hill, Middlesex College, or the Thames Valley? Upload a photo. Takes 10 seconds.",
    },
    {
        icon: Sparkles,
        title: "AI analyses and flags them",
        detail:
            "Wingman AI estimates flock size, reads nesting posture and wing position, and assigns a live risk level.",
    },
    {
        icon: MapPinned,
        title: "Sightings hit the map",
        detail:
            "Your report becomes a hotspot on the live campus map, visible to every Mustang checking their route before they leave class.",
    },
    {
        icon: Route,
        title: "Walk around them",
        detail:
            "Check the map before you leave. See which paths are high-risk right now. Pick a quieter route. Arrive un-honked-at.",
    },
];

export default function HomePage() {
    const { sightings } = useSightings();
    const total = sightings.reduce((s, x) => s + x.gooseCount, 0);
    const today = new Date().toDateString();
    const todayCount = sightings.filter(
        (x) => new Date(x.createdAt).toDateString() === today
    ).length;
    const highZones = sightings.filter((x) => x.riskLevel === "high").length;
    const mapPreview = sightings.slice(0, 4);

    return (
        <div className="relative flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-western-purple-faint pb-20 md:overflow-x-visible md:pb-0">

            <Header />

            {/* Campus ticker */}
            <div className="relative z-10 mt-5 border-y border-western-purple/10 bg-western-purple/25 px-4 py-2 text-xs text-western-purple md:text-sm">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
                    <span className="flex items-center font-medium">
                        Built by Mustangs, for Mustangs.
                    </span>
                </div>
            </div>

            <main className="relative z-10 mx-auto w-full min-w-0 max-w-lg flex-1 px-4 pt-8 pb-10 sm:px-6 md:max-w-6xl md:pt-12">

                {/* ─── HERO SPLIT ─── */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid items-stretch gap-6 md:grid-cols-[1.05fr_1fr]"
                >
                    {/* Left: headline + CTAs */}
                    <div className="flex min-w-0 flex-col justify-between rounded-3xl border border-western-purple/15 bg-white p-6 shadow-sm sm:p-7 md:p-10">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-western-purple/20 bg-western-purple-faint px-3 py-1 text-xs font-semibold text-western-purple">
                                <span className="size-1.5 rounded-full bg-western-purple animate-pulse" />
                                Live Campus Map · Western University
                            </div>
                            <h1 className="text-4xl font-bold leading-[0.95] tracking-tight break-words text-black sm:text-5xl md:text-7xl">
                                Dodge the
                                <br />
                                <span className="text-western-purple">Waddling Warlords!</span>
                            </h1>
                            <p className="mt-5 text-xl font-medium text-black/80">
                                Western's live AI goose tracker.
                            </p>
                            <p className="mt-4 max-w-xl text-pretty text-black/65">
                                Upload a photo, get an instant goose count, nesting and gosling
                                detection, and aggression signals. Then check the live map before
                                you walk.
                            </p>

                            {/* Coverage pill */}
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-western-purple/25 bg-western-purple-faint px-3 py-1 text-xs font-medium text-western-purple">
                                    <span className="size-1.5 rounded-full bg-western-purple" />
                                    Western-only coverage
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/map"
                                className="rounded-full bg-black px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-western-purple"
                            >
                                Open Map
                            </Link>
                            <Link
                                href="/report"
                                className="rounded-full border border-black/20 px-6 py-3 font-semibold text-black transition hover:border-western-purple hover:text-western-purple"
                            >
                                Report Sighting
                            </Link>
                        </div>
                    </div>

                    {/* Right: live map preview + sighting list */}
                    <div className="overflow-hidden rounded-3xl border border-western-purple/15 bg-white shadow-sm">
                        {/* Map thumbnail */}
                        <div className="relative h-56 w-full overflow-hidden border-b border-western-purple/10 md:h-75">
                            <div className="pointer-events-none absolute inset-0">
                                <GooseMapDynamic sightings={sightings} interactive={false} />
                            </div>
                            <Link
                                href="/map"
                                className="absolute inset-0 z-10"
                                aria-label="Open live campus map"
                            />
                            <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-western-purple/20 bg-white/90 px-3 py-1 text-xs font-medium text-western-purple backdrop-blur-sm">
                                <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                                Off-season · Western campus live
                            </div>
                        </div>

                        {/* Sighting list */}
                        <div className="p-4 md:p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-black">
                                    <span className="size-2 rounded-full bg-green-500" />
                                    Live Campus Map
                                </p>
                                <Link
                                    href="/map"
                                    className="text-xs font-medium text-black/50 hover:text-western-purple"
                                >
                                    View all →
                                </Link>
                            </div>

                            <div className="space-y-0 divide-y divide-black/6">
                                {mapPreview.length === 0 ? (
                                    <p className="py-3 text-sm text-black/50">
                                        No reports yet. Be the first Mustang to mark today's goose
                                        activity.
                                    </p>
                                ) : (
                                    mapPreview.map((s) => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between py-3"
                                        >
                                            <span className="text-sm font-medium text-black">
                                                {s.locationName ?? "Campus"}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={
                                                        s.riskLevel === "high"
                                                            ? "text-xs text-red-500"
                                                            : s.riskLevel === "medium"
                                                                ? "text-xs text-amber-500"
                                                                : "text-xs text-green-600"
                                                    }
                                                >
                                                    {s.riskLevel === "high"
                                                        ? "High risk"
                                                        : s.riskLevel === "medium"
                                                            ? "Moderate"
                                                            : "Low risk"}
                                                </span>
                                                <span className="w-6 text-right text-sm font-semibold text-black">
                                                    {s.gooseCount}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer stat line */}
                            {sightings.length > 0 && (
                                <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-3">
                                    <p className="text-xs font-semibold text-black">
                                        {total} active geese
                                        <span className="font-normal text-black/50">
                                            {" "}· {sightings.length} zones
                                        </span>
                                    </p>
                                    <Link
                                        href="/map"
                                        className="text-xs font-medium text-black/50 hover:text-western-purple"
                                    >
                                        View all →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ─── TECH TICKER ─── */}
                <div className="mt-10 flex w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-black/30 sm:gap-x-4 sm:text-[11px] sm:tracking-[0.18em]">
                    <span className="whitespace-nowrap">YOLO</span>
                    <span aria-hidden>·</span>
                    <span className="whitespace-nowrap">Gemini</span>
                    <span aria-hidden>·</span>
                    <span className="whitespace-nowrap">Nesting Detection</span>
                    <span aria-hidden>·</span>
                    <span className="whitespace-nowrap">Aggression Signals</span>
                    <span aria-hidden>·</span>
                    <span className="whitespace-nowrap">Live Campus Map</span>
                </div>

                {/* ─── MAP SECTION ─── */}
                <section className="mt-20 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/70">
                        The Campus Map
                    </p>
                    <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight break-words text-black sm:text-4xl md:text-5xl">
                        Never get ambushed by a cobra chicken again.{" "}
                        <span aria-hidden>🪿</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-black/60">
                        See active nesting zones, aggressive flocks, and high-risk paths
                        across Western before you head out. Built for Mustangs walking
                        campus every day.
                    </p>
                    <div className="mt-8">
                        <GooseCarousel />
                    </div>
                    <Link
                        href="/map"
                        className="mt-6 inline-flex rounded-full bg-black px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-western-purple"
                    >
                        Open Live Map
                    </Link>
                </section>

                {/* ─── HOW IT WORKS ─── */}
                <section className="mt-24 grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
                    {/* Left: big text + description */}
                    <div className="md:sticky md:top-28">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/70">
                            How it works
                        </p>
                        <h2 className="mt-3 text-5xl font-semibold leading-[1.02] tracking-tight text-black md:text-6xl">
                            Capture.
                            <br />
                            Analyze.
                            <br />
                            Evade.
                        </h2>
                        <p className="mt-5 max-w-sm text-black/60">
                            Wingman AI processes sightings from Western students and updates
                            the map fast enough for real, day-to-day route decisions. Built
                            in-house, with no third-party tracking.
                        </p>
                    </div>

                    {/* Right: step cards */}
                    <div className="space-y-4">
                        {steps.map((step, idx) => (
                            <div
                                key={step.title}
                                className="rounded-2xl border border-western-purple/20 bg-white p-5 shadow-sm shadow-western-purple/10 md:transition-transform md:hover:scale-105"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
                                        <step.icon className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-western-purple">
                                            {String(idx + 1).padStart(2, "0")}
                                        </p>
                                        <h3 className="mt-0.5 text-base font-semibold text-black">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1.5 text-sm text-black/70">
                                            {step.detail}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── PARTNER SECTION ─── */}
                <section className="mt-24 rounded-3xl border border-western-purple/15 bg-white px-6 py-10 shadow-sm md:px-12 md:py-14">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-western-purple/70">
                        Partner with Western Wingman
                    </p>
                    <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-black md:text-5xl">
                        Reach students at Western{" "}
                        <span className="underline decoration-western-purple decoration-2 underline-offset-4">
                            who walk on campus
                        </span>
                    </h2>
                    <p className="mt-4 max-w-2xl text-black/60">
                        Western Wingman is used daily by Mustangs navigating goose activity
                        across campus. If your brand supports student life at Western, we'd
                        love to connect.
                    </p>

                    {/* Stats row */}
                    {/* <div className="mt-10 grid gap-6 border-y border-black/8 py-8 md:grid-cols-4">
                        {[
                            { stat: "35k+", label: "students at Western" },
                            { stat: "100%", label: "Western-focused, zero wasted reach" },
                            { stat: "25k+", label: "monthly campus map checks" },
                            { stat: "2200+", label: "active users and growing" },
                        ].map(({ stat, label }) => (
                            <div key={stat}>
                                <p className="text-3xl font-semibold text-black">{stat}</p>
                                <p className="mt-1 text-sm text-black/55">{label}</p>
                            </div>
                        ))}
                    </div> */}

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <a
                            href="mailto:davidanukam72@gmail.com"
                            className="inline-flex rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-western-purple"
                        >
                            Get in touch
                        </a>
                        <span className="text-sm text-black/45">davidanukam72@gmail.com</span>
                    </div>
                </section>

                {/* ─── FOOTER ─── */}
                <footer className="mt-16 pb-4 text-center text-sm text-black/35">
                    Made with 💜 for Western Mustangs
                </footer>
            </main>

            <MobileNav />
        </div>
    );
}
