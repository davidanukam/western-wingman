import maplibregl from "maplibre-gl";
import { WESTERN_CAMPUS_BOUNDS } from "@/lib/geo";

const campusBounds = new maplibregl.LngLatBounds(
  WESTERN_CAMPUS_BOUNDS.sw,
  WESTERN_CAMPUS_BOUNDS.ne
);

/** Prevent zooming out past a view that fits all of Western's main campus. Panning is unrestricted. */
export function applyWesternCampusMinZoom(map: maplibregl.Map, padding = 48): void {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const bearing = map.getBearing();
  const pitch = map.getPitch();

  map.fitBounds(campusBounds, { padding, duration: 0, maxZoom: 22 });
  map.setMinZoom(map.getZoom());
  map.jumpTo({ center, zoom, bearing, pitch });
}
