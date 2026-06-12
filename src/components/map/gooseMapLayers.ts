import type { AddLayerObject } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import { buildSightingsGeoJSON, heatmapPaint } from "./HeatmapLayer";
import { clearGooseMarkersForMap, syncGooseMarkers } from "./gooseMapMarkers";
import { ensureSafeRouteSource } from "./SafeRouteLayer";
import type { Sighting } from "@/types";

function ensureHeatmapLayer(m: maplibregl.Map): void {
  if (!m.getSource("sightings") || m.getLayer("goose-heat")) return;

  m.addLayer({
    id: "goose-heat",
    type: "heatmap",
    source: "sightings",
    paint: heatmapPaint,
  } as AddLayerObject);
}

function syncHeatmapSource(m: maplibregl.Map, sightings: Sighting[]): void {
  const geojson = buildSightingsGeoJSON(sightings);

  if (!m.getSource("sightings")) {
    m.addSource("sightings", { type: "geojson", data: geojson });
    ensureHeatmapLayer(m);
  } else {
    (m.getSource("sightings") as maplibregl.GeoJSONSource).setData(geojson);
  }
}

function waitForMapReady(m: maplibregl.Map): Promise<void> {
  if (m.isStyleLoaded() && m.loaded()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      if (m.isStyleLoaded() && m.loaded()) {
        m.off("idle", done);
        m.off("load", done);
        resolve();
      }
    };
    m.on("idle", done);
    m.on("load", done);
  });
}

/** Heatmap + HTML markers. Safe to call before sightings fetch completes — call again when data arrives. */
export async function applySightingsToMap(
  m: maplibregl.Map,
  sightings: Sighting[],
  options?: { recreateMarkers?: boolean }
): Promise<void> {
  await waitForMapReady(m);

  if (options?.recreateMarkers) {
    clearGooseMarkersForMap(m);
  }

  syncHeatmapSource(m, sightings);
  syncGooseMarkers(m, sightings);

  try {
    ensureSafeRouteSource(m);
  } catch {
    /* ignore */
  }
}
