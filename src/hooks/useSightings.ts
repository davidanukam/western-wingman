"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { Sighting } from "@/types";

export function useSightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/sightings")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setSightings(data);
      })
      .catch(() => {
        if (!cancelled) setSightings([]);
      });

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return () => { cancelled = true; };

    const channel = supabase
      .channel("sightings-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Sighting" },
        (payload) => {
          const row = payload.new as Sighting;
          setSightings((prev) => [row, ...prev]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { sightings };
}
