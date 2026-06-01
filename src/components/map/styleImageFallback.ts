import type maplibregl from "maplibre-gl";

/** 1×1 transparent RGBA — placeholder for sprites missing from the base style sheet. */
const TRANSPARENT_PIXEL = new Uint8Array(4);

/**
 * OpenFreeMap Liberty references some POI icons not present in its sprite JSON.
 * Register transparent placeholders so MapLibre stops warning and layers still render.
 */
export function attachStyleImageFallback(map: maplibregl.Map): () => void {
  const onMissing = (event: { id: string }) => {
    if (map.hasImage(event.id)) return;
    try {
      map.addImage(
        event.id,
        { width: 1, height: 1, data: TRANSPARENT_PIXEL },
        { pixelRatio: 1 }
      );
    } catch {
      /* ignore duplicate addImage races */
    }
  };

  map.on("styleimagemissing", onMissing);
  return () => {
    map.off("styleimagemissing", onMissing);
  };
}
