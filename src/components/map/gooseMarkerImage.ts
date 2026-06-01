import type maplibregl from "maplibre-gl";
import { GOOSE_MARKER_URL } from "./gooseMapIcon";

let cachedImage: HTMLImageElement | null = null;
let loadPromise: Promise<HTMLImageElement> | null = null;

/**
 * `<use href="#symbol">` inside SVG often rasterizes as blank in canvas / MapLibre.
 * Inline the symbol so the goose image actually paints.
 */
export function prepareGooseMarkerSvg(svgText: string): string {
  if (typeof DOMParser === "undefined") return svgText;

  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const symbol = doc.querySelector("symbol#D");
  const useEl =
    doc.querySelector('use[href="#D"]') ??
    doc.querySelector('use[xlink\\:href="#D"]');

  if (!symbol || !useEl) return svgText;

  const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
  const x = useEl.getAttribute("x") ?? "0";
  const y = useEl.getAttribute("y") ?? "0";
  const extra = useEl.getAttribute("transform");
  const parts = [`translate(${x}, ${y})`, extra].filter(Boolean).join(" ");
  if (parts) g.setAttribute("transform", parts);

  while (symbol.firstChild) {
    g.appendChild(symbol.firstChild);
  }
  useEl.replaceWith(g);
  symbol.remove();

  return new XMLSerializer().serializeToString(doc.documentElement);
}

function loadGooseMarkerImage(): Promise<HTMLImageElement> {
  if (cachedImage) return Promise.resolve(cachedImage);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch(GOOSE_MARKER_URL);
    if (!res.ok) throw new Error(`Failed to fetch goose marker: ${res.status}`);
    const svgText = prepareGooseMarkerSvg(await res.text());
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Goose marker image decode failed"));
        el.src = objectUrl;
      });

      if (!imageHasVisiblePixels(img)) {
        throw new Error("Goose marker SVG rasterized empty");
      }

      cachedImage = img;
      return img;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  })().catch((e) => {
    loadPromise = null;
    throw e;
  });

  return loadPromise;
}

function imageHasVisiblePixels(img: HTMLImageElement): boolean {
  const w = img.naturalWidth || 61;
  const h = img.naturalHeight || 76;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 8) return true;
  }
  return false;
}

/** Register the goose sprite on the map (re-run after style changes). */
export async function ensureGooseMarkerImage(map: maplibregl.Map): Promise<boolean> {
  if (!map.isStyleLoaded()) return false;

  if (map.hasImage("goose-marker")) return true;

  try {
    const img = await loadGooseMarkerImage();
    if (!map.isStyleLoaded()) return false;
    if (!map.hasImage("goose-marker")) {
      map.addImage("goose-marker", img, { pixelRatio: 2, sdf: false });
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/** Clear cached bitmap after SVG asset changes (dev hot reload). */
export function resetGooseMarkerImageCache(): void {
  cachedImage = null;
  loadPromise = null;
}
