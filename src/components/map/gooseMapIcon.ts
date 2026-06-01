import type { ExpressionSpecification } from "maplibre-gl";

/** MapLibre marker image — served from /public/goose-map-icon.svg */
export const GOOSE_MARKER_URL = "/goose-map-icon.svg";

/**
 * Goose marker scale at each zoom level.
 * Format: [zoom, iconSize] — iconSize is a MapLibre multiplier (not pixels).
 * Lower values = smaller icon; add more pairs to fine-tune the curve.
 */
export const GOOSE_MARKER_SIZE_STOPS: ReadonlyArray<[zoom: number, size: number]> = [
    [12, 0.2],
    [14, 0.23],
    [15, 0.24],
    [16, 0.25],
    [18, 0.3],
];

/** Uniform multiplier on every stop (e.g. 1.15 = 15% larger at all zoom levels). */
export const GOOSE_MARKER_SIZE_SCALE = 1;

/** MapLibre layout `icon-size` — shrinks when zoomed out, grows when zoomed in. */
export function gooseMarkerIconSizeExpression(): ExpressionSpecification {
    const stops: number[] = [];
    for (const [zoom, size] of GOOSE_MARKER_SIZE_STOPS) {
        stops.push(zoom, size * GOOSE_MARKER_SIZE_SCALE);
    }
    return ["interpolate", ["linear"], ["zoom"], ...stops];
}
