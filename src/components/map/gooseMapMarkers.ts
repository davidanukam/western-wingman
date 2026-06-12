import maplibregl from "maplibre-gl";
import type { Sighting } from "@/types";
import { GOOSE_MARKER_SIZE_SCALE, GOOSE_MARKER_SIZE_STOPS, GOOSE_MARKER_URL } from "./gooseMapIcon";

type MarkerRecord = {
  marker: maplibregl.Marker;
  popup: maplibregl.Popup;
};

/** Per-map registry — module-level Map caused stale markers after reload/style change. */
const registryByMap = new WeakMap<maplibregl.Map, Map<string, MarkerRecord>>();
const zoomHandlerByMap = new WeakMap<maplibregl.Map, () => void>();

/** CSS scale multiplier for HTML markers (GOOSE_MARKER_SIZE_STOPS values stay unchanged). */
const MARKER_DISPLAY_SCALE = 2.2;

function getRegistry(map: maplibregl.Map): Map<string, MarkerRecord> {
  let registry = registryByMap.get(map);
  if (!registry) {
    registry = new Map();
    registryByMap.set(map, registry);
  }
  return registry;
}

/** Interpolate GOOSE_MARKER_SIZE_STOPS for the current zoom (do not edit the stops themselves). */
export function scaleForZoom(zoom: number): number {
  const stops = GOOSE_MARKER_SIZE_STOPS.map(
    ([z, s]) => [z, s * GOOSE_MARKER_SIZE_SCALE * MARKER_DISPLAY_SCALE] as const
  );
  if (zoom <= stops[0][0]) return stops[0][1];
  if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [z0, s0] = stops[i];
    const [z1, s1] = stops[i + 1];
    if (zoom >= z0 && zoom <= z1) {
      const t = (zoom - z0) / (z1 - z0);
      return s0 + (s1 - s0) * t;
    }
  }
  return stops[0][1];
}

function gooseCountLabel(count: number): string {
  if (count <= 0) return "0 geese spotted";
  if (count === 1) return "1 goose spotted";
  const low = Math.max(1, Math.floor(count * 0.85));
  const high = Math.max(low + 1, Math.ceil(count * 1.15));
  return `${low}-${high} geese spotted`;
}

function riskLabel(level: Sighting["riskLevel"]): string {
  if (level === "high") return "High risk";
  if (level === "medium") return "Moderate risk";
  return "Low risk";
}

function riskClass(level: Sighting["riskLevel"]): string {
  if (level === "high") return "text-red-600";
  if (level === "medium") return "text-amber-600";
  return "text-green-600";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPopupHtml(s: Sighting): string {
  const location = s.locationName ?? "Campus sighting";
  const summary =
    s.aiSummary ??
    s.description ??
    (s.isNesting
      ? "Nesting activity possible — keep dogs leashed and stay on paths."
      : s.isAggressive
        ? "Aggressive behaviour reported — give the area space."
        : "Geese reported in this area.");

  return `
    <div class="goose-popup">
      <p class="goose-popup__title">${escapeHtml(location)}</p>
      <p class="goose-popup__meta">
        <span class="${riskClass(s.riskLevel)}">${riskLabel(s.riskLevel)}</span>
        <span class="goose-popup__dot">·</span>
        <span>${escapeHtml(gooseCountLabel(s.gooseCount))}</span>
      </p>
      <p class="goose-popup__summary">${escapeHtml(summary)}</p>
    </div>
  `;
}

function createMarkerRecord(map: maplibregl.Map, sighting: Sighting): MarkerRecord {
  const wrap = document.createElement("button");
  wrap.type = "button";
  wrap.className = "goose-map-marker";
  wrap.setAttribute(
    "aria-label",
    `${sighting.locationName ?? "Goose sighting"}, ${gooseCountLabel(sighting.gooseCount)}`
  );

  const img = document.createElement("img");
  img.src = GOOSE_MARKER_URL;
  img.alt = "";
  img.width = 44;
  img.height = 55;
  img.draggable = false;
  wrap.appendChild(img);

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 16,
    className: "goose-sighting-popup",
    maxWidth: "280px",
  }).setHTML(buildPopupHtml(sighting));

  const showPopup = () => {
    popup.setLngLat([sighting.lng, sighting.lat]).addTo(map);
  };
  const hidePopup = () => {
    popup.remove();
  };

  wrap.addEventListener("mouseenter", showPopup);
  wrap.addEventListener("mouseleave", hidePopup);
  wrap.addEventListener("focus", showPopup);
  wrap.addEventListener("blur", hidePopup);

  const marker = new maplibregl.Marker({
    element: wrap,
    anchor: "bottom",
  })
    .setLngLat([sighting.lng, sighting.lat])
    .addTo(map);

  return { marker, popup };
}

function applyMarkerScale(map: maplibregl.Map): void {
  const scale = scaleForZoom(map.getZoom());
  const registry = registryByMap.get(map);
  if (!registry) return;
  for (const { marker } of registry.values()) {
    const el = marker.getElement();
    if (el) el.style.setProperty("--goose-scale", String(scale));
  }
}

function ensureZoomHandler(map: maplibregl.Map): void {
  if (zoomHandlerByMap.has(map)) return;
  const handler = () => applyMarkerScale(map);
  zoomHandlerByMap.set(map, handler);
  map.on("zoom", handler);
}

/** Drop all markers for one map (required after style reload — MapLibre detaches DOM markers). */
export function clearGooseMarkersForMap(map: maplibregl.Map): void {
  const registry = registryByMap.get(map);
  if (!registry) return;
  for (const record of registry.values()) {
    record.marker.remove();
    record.popup.remove();
  }
  registry.clear();
}

/** Sync HTML goose markers for a single map instance. */
export function syncGooseMarkers(map: maplibregl.Map, sightings: Sighting[]): void {
  if (!map.getContainer().isConnected) return;

  ensureZoomHandler(map);
  const registry = getRegistry(map);
  const nextIds = new Set(sightings.map((s) => s.id));

  for (const [id, record] of registry) {
    if (!nextIds.has(id)) {
      record.marker.remove();
      record.popup.remove();
      registry.delete(id);
    }
  }

  for (const s of sightings) {
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;

    const existing = registry.get(s.id);
    if (existing) {
      const el = existing.marker.getElement();
      if (!el?.isConnected) {
        existing.marker.remove();
        existing.popup.remove();
        registry.delete(s.id);
        registry.set(s.id, createMarkerRecord(map, s));
      } else {
        existing.marker.setLngLat([s.lng, s.lat]);
        existing.popup.setHTML(buildPopupHtml(s));
      }
      continue;
    }
    registry.set(s.id, createMarkerRecord(map, s));
  }

  applyMarkerScale(map);
}

export function detachGooseMarkerZoomHandler(map: maplibregl.Map): void {
  const handler = zoomHandlerByMap.get(map);
  if (handler) {
    map.off("zoom", handler);
    zoomHandlerByMap.delete(map);
  }
  clearGooseMarkersForMap(map);
  registryByMap.delete(map);
}
