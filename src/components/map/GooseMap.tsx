"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyWesternCampusMinZoom } from "./campusMapLimits";
import { ensureCampusDetailLayers } from "./campusDetailLayers";
import { applySightingsToMap } from "./gooseMapLayers";
import { detachGooseMarkerZoomHandler } from "./gooseMapMarkers";
import { attachStyleImageFallback } from "./styleImageFallback";
import { DEFAULT_MAP_STYLE } from "@/lib/mapStyle";
import type { Sighting } from "@/types";

const WESTERN_CENTER: [number, number] = [-81.2742, 43.0096];

export type GooseMapProps = {
  sightings: Sighting[];
  onMapReady?: (map: maplibregl.Map) => void;
};

export function GooseMap({ sightings, onMapReady }: GooseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const sightingsRef = useRef(sightings);
  const initialLoadDoneRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    sightingsRef.current = sightings;
  }, [sightings]);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  const syncSightings = (recreateMarkers = false) => {
    const m = mapInstance.current;
    if (!m) return;
    void applySightingsToMap(m, sightingsRef.current, { recreateMarkers });
  };

  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: WESTERN_CENTER,
      zoom: 15,
      fadeDuration: 0,
      refreshExpiredTiles: false,
    });

    mapInstance.current = map;
    const detachImageFallback = attachStyleImageFallback(map);

    const canvas = map.getCanvas();
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
    });

    const syncMinZoom = () => applyWesternCampusMinZoom(map);

    const onLoad = () => {
      void (async () => {
        syncMinZoom();
        try {
          await ensureCampusDetailLayers(map);
        } catch (e) {
          console.error("Campus map layers failed:", e);
        }
        initialLoadDoneRef.current = true;
        setMapReady(true);
        onMapReadyRef.current?.(map);
        await applySightingsToMap(map, sightingsRef.current, { recreateMarkers: true });
      })();
    };

    /** Style reload drops DOM markers — always recreate. Skip duplicate first style.load before load finishes. */
    const onStyleLoad = () => {
      if (!initialLoadDoneRef.current) return;
      void applySightingsToMap(map, sightingsRef.current, { recreateMarkers: true });
    };

    map.on("load", onLoad);
    map.on("style.load", onStyleLoad);
    map.on("resize", syncMinZoom);

    return () => {
      map.off("load", onLoad);
      map.off("style.load", onStyleLoad);
      map.off("resize", syncMinZoom);
      detachImageFallback();
      detachGooseMarkerZoomHandler(map);
      map.remove();
      mapInstance.current = null;
      initialLoadDoneRef.current = false;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    syncSightings(false);
  }, [sightings, mapReady]);

  return <div ref={containerRef} className="h-full w-full min-h-60" />;
}
