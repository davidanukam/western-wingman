import type maplibregl from "maplibre-gl";

/** Placeholder safe-route polyline (empty). Replace with routing logic later. */
export const emptyRouteGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function ensureSafeRouteSource(m: maplibregl.Map) {
  if (!m.getSource("safe-route")) {
    m.addSource("safe-route", {
      type: "geojson",
      data: emptyRouteGeoJSON,
    });
    m.addLayer({
      id: "safe-route-line",
      type: "line",
      source: "safe-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#16a34a",
        "line-width": 4,
        "line-opacity": 0.85,
      },
    });
  }
}
