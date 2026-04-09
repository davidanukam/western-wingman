"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { AddLayerObject } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSightings } from "@/hooks/useSightings";
import { buildSightingsGeoJSON, heatmapPaint } from "./HeatmapLayer";
import { ensureSafeRouteSource } from "./SafeRouteLayer";
import { GOOSE_MARKER_DATA_URL } from "./gooseMapIcon";
import type { Sighting } from "@/types";

const WESTERN_CENTER: [number, number] = [-81.2742, 43.0096];

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export type GooseMapProps = {
  onMapReady?: (map: maplibregl.Map) => void;
};

function applySightingsToMap(m: maplibregl.Map, sightings: Sighting[]) {
  if (!m.isStyleLoaded()) return;

  const geojson = buildSightingsGeoJSON(sightings);

  const addHeatmapAndSymbols = (withSymbols: boolean) => {
    if (m.getSource("sightings")) {
      (m.getSource("sightings") as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    m.addSource("sightings", { type: "geojson", data: geojson });
    m.addLayer({
      id: "goose-heat",
      type: "heatmap",
      source: "sightings",
      paint: heatmapPaint,
    } as AddLayerObject);

    if (withSymbols && m.hasImage("goose-marker")) {
      m.addLayer({
        id: "goose-icons",
        type: "symbol",
        source: "sightings",
        layout: {
          "icon-image": "goose-marker",
          "icon-size": 0.42,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      } as AddLayerObject);
    }

    try {
      ensureSafeRouteSource(m);
    } catch {
      /* ignore */
    }
  };

  if (m.hasImage("goose-marker")) {
    addHeatmapAndSymbols(true);
    return;
  }

  const img = new Image();
  img.onload = () => {
    if (!m.isStyleLoaded()) return;
    try {
      if (!m.hasImage("goose-marker")) {
        m.addImage("goose-marker", img, { pixelRatio: 2 });
      }
    } catch {
      /* already registered */
    }
    addHeatmapAndSymbols(true);
  };
  img.onerror = () => {
    if (!m.isStyleLoaded()) return;
    addHeatmapAndSymbols(false);
  };
  img.src = GOOSE_MARKER_DATA_URL;
}

export function GooseMap({ onMapReady }: GooseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);

  const [mapReady, setMapReady] = useState(false);
  const { sightings } = useSightings();

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: WESTERN_CENTER,
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapInstance.current = map;

    const onLoad = () => {
      setMapReady(true);
      onMapReadyRef.current?.(map);
    };
    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      map.remove();
      mapInstance.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const m = mapInstance.current;
    if (!m || !mapReady) return;
    applySightingsToMap(m, sightings);
  }, [sightings, mapReady]);

  return <div ref={containerRef} className="h-full w-full min-h-[240px]" />;
}
