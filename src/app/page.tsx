"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { GooseMapDynamic } from "@/components/map/GooseMapDynamic";
import { SightingCard } from "@/components/ui/SightingCard";
import { useSightings } from "@/hooks/useSightings";

export default function HomePage() {
  const { sightings } = useSightings();
  const total = sightings.reduce((s, x) => s + x.gooseCount, 0);
  const today = new Date().toDateString();
  const todayCount = sightings.filter((x) => new Date(x.createdAt).toDateString() === today).length;
  const highZones = sightings.filter((x) => x.riskLevel === "high").length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-western-purple-faint pb-20 md:pb-0">
      <Header />

      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        Nesting season active · Western University campus
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 pt-10 pb-8 md:max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-4xl font-bold leading-tight text-western-purple">
            Avoid the
            <br />
            <span className="text-western-purple-light">Honk.</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Western&apos;s live goose tracker.</p>
          <p className="mt-4 text-pretty text-foreground/90">
            Upload a photo, get an instant goose count, nesting and gosling detection, and aggression
            signals. Check the live map before you walk.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="rounded-full bg-western-purple px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-western-purple-dark"
            >
              Open Map
            </Link>
            <Link
              href="/report"
              className="rounded-full border border-western-purple px-6 py-3 font-semibold text-western-purple transition hover:bg-western-purple/5"
            >
              Report Sighting
            </Link>
          </div>
        </motion.section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-western-purple">
            Live campus preview
          </h2>
          <div className="overflow-hidden rounded-2xl border border-western-purple/20 shadow-sm">
            <div className="h-56 w-full md:h-72">
              <GooseMapDynamic />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">Est. geese</p>
            <p className="mt-1 text-2xl font-bold text-western-purple">~{total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">Sightings today</p>
            <p className="mt-1 text-2xl font-bold text-western-purple">{todayCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">High-risk zones</p>
            <p className="mt-1 text-2xl font-bold text-danger-red">{highZones}</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-western-purple">
            Recent sightings
          </h2>
          <div className="space-y-3">
            {sightings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sightings yet. Report the first flock.</p>
            ) : (
              sightings.slice(0, 6).map((s) => <SightingCard key={s.id} sighting={s} />)
            )}
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
