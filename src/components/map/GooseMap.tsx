"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyWesternCampusMinZoom } from "./campusMapLimits";
import { ensureCampusDetailLayers } from "./campusDetailLayers";
import { applySightingsToMap } from "./gooseMapLayers";
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

    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        sightingsRef.current = sightings;
    }, [sightings]);

    useEffect(() => {
        onMapReadyRef.current = onMapReady;
    }, [onMapReady]);

    const syncSightings = () => {
        const m = mapInstance.current;
        if (!m || !mapReady) return;
        void applySightingsToMap(m, sightingsRef.current);
    };

    useEffect(() => {
        if (!containerRef.current || mapInstance.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: DEFAULT_MAP_STYLE,
            center: WESTERN_CENTER,
            zoom: 15,
        });

        mapInstance.current = map;
        const detachImageFallback = attachStyleImageFallback(map);

        const syncMinZoom = () => applyWesternCampusMinZoom(map);

        const onLoad = () => {
            void (async () => {
                syncMinZoom();
                try {
                    await ensureCampusDetailLayers(map);
                } catch (e) {
                    console.error("Campus map layers failed:", e);
                }
                setMapReady(true);
                onMapReadyRef.current?.(map);
                await applySightingsToMap(map, sightingsRef.current);
            })();
        };

        /** Base style reload drops custom images — re-attach sightings layers. */
        const onStyleLoad = () => {
            void applySightingsToMap(map, sightingsRef.current);
        };

        map.on("load", onLoad);
        map.on("styledata", onStyleLoad);
        map.on("resize", syncMinZoom);

        return () => {
            map.off("load", onLoad);
            map.off("styledata", onStyleLoad);
            map.off("resize", syncMinZoom);
            detachImageFallback();
            map.remove();
            mapInstance.current = null;
            setMapReady(false);
        };
    }, []);

    useEffect(() => {
        syncSightings();
    }, [sightings, mapReady]);

    return <div ref={containerRef} className="h-full w-full min-h-60" />;
}
