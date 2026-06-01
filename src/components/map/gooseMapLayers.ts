import type { AddLayerObject } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import { buildSightingsGeoJSON, heatmapPaint } from "./HeatmapLayer";
import { ensureSafeRouteSource } from "./SafeRouteLayer";
import { gooseMarkerIconSizeExpression } from "./gooseMapIcon";
import { ensureGooseMarkerImage } from "./gooseMarkerImage";
import type { Sighting } from "@/types";

function moveLayerToTop(m: maplibregl.Map, layerId: string): void {
  if (!m.getLayer(layerId)) return;
  try {
    m.moveLayer(layerId);
  } catch {
    /* ignore */
  }
}

function ensureGoosePointsLayer(m: maplibregl.Map): void {
  if (!m.getSource("sightings") || m.getLayer("goose-points")) return;

  m.addLayer({
    id: "goose-points",
    type: "circle",
    source: "sightings",
    minzoom: 12,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 7, 16, 12],
      "circle-color": "#4f2683",
      "circle-opacity": 0.92,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  } as AddLayerObject);
}

function ensureGooseIconsLayer(m: maplibregl.Map): void {
  if (!m.getSource("sightings") || !m.hasImage("goose-marker")) return;

  if (!m.getLayer("goose-icons")) {
    m.addLayer({
      id: "goose-icons",
      type: "symbol",
      source: "sightings",
      minzoom: 12,
      layout: {
        "icon-image": "goose-marker",
        "icon-size": gooseMarkerIconSizeExpression(),
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    } as AddLayerObject);
  }

  moveLayerToTop(m, "goose-points");
  moveLayerToTop(m, "goose-icons");
}

function ensureHeatmapLayer(m: maplibregl.Map): void {
  if (!m.getSource("sightings") || m.getLayer("goose-heat")) return;

  m.addLayer({
    id: "goose-heat",
    type: "heatmap",
    source: "sightings",
    paint: heatmapPaint,
  } as AddLayerObject);
}

async function syncSightingsLayers(
  m: maplibregl.Map,
  sightings: Sighting[]
): Promise<void> {
  const geojson = buildSightingsGeoJSON(sightings);

  if (!m.getSource("sightings")) {
    m.addSource("sightings", { type: "geojson", data: geojson });
    ensureHeatmapLayer(m);
  } else {
    (m.getSource("sightings") as maplibregl.GeoJSONSource).setData(geojson);
  }

  ensureGoosePointsLayer(m);

  const hasMarker = await ensureGooseMarkerImage(m);
  if (hasMarker) {
    ensureGooseIconsLayer(m);
    // Hide purple dots when the goose sprite is visible
    if (m.getLayer("goose-points")) {
      m.setPaintProperty("goose-points", "circle-opacity", 0);
    }
  } else if (m.getLayer("goose-points")) {
    m.setPaintProperty("goose-points", "circle-opacity", 0.92);
  }

  moveLayerToTop(m, "goose-points");
  moveLayerToTop(m, "goose-icons");

  try {
    ensureSafeRouteSource(m);
  } catch {
    /* ignore */
  }
}

export async function applySightingsToMap(
  m: maplibregl.Map,
  sightings: Sighting[]
): Promise<void> {
  if (m.isStyleLoaded()) {
    await syncSightingsLayers(m, sightings);
    return;
  }

  await new Promise<void>((resolve) => {
    m.once("load", () => {
      void syncSightingsLayers(m, sightings).then(resolve);
    });
  });
}
