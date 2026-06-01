/** Shared MapLibre style — OpenFreeMap Liberty shows OSM road names, shields, and POIs. */
export const DEFAULT_MAP_STYLE =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
  "https://tiles.openfreemap.org/styles/liberty";

/**
 * Font stacks hosted by OpenFreeMap (see Liberty style glyphs).
 * Use a single entry only — comma-joined fallbacks 404 on tiles.openfreemap.org.
 */
export const MAP_TEXT_FONT_REGULAR = ["Noto Sans Regular"] as const;
export const MAP_TEXT_FONT_BOLD = ["Noto Sans Bold"] as const;
