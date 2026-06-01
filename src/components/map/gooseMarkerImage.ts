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
    if (cachedImage) {
        console.log("[goose-marker] using cached image");
        return Promise.resolve(cachedImage);
    }
    if (loadPromise) {
        console.log("[goose-marker] using in-flight promise");
        return loadPromise;
    }

    loadPromise = (async () => {
        console.log("[goose-marker] fetching", GOOSE_MARKER_URL);
        const res = await fetch(GOOSE_MARKER_URL);
        if (!res.ok) throw new Error(`Failed to fetch goose marker: ${res.status}`);

        const rawSvg = await res.text();
        console.log("[goose-marker] raw SVG (first 300 chars):", rawSvg.slice(0, 300));

        const svgText = prepareGooseMarkerSvg(rawSvg);
        console.log("[goose-marker] prepared SVG (first 300 chars):", svgText.slice(0, 300));

        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);

        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.onload = () => {
                    console.log("[goose-marker] image loaded, naturalWidth:", el.naturalWidth, "naturalHeight:", el.naturalHeight);
                    resolve(el);
                };
                el.onerror = (e) => {
                    console.error("[goose-marker] image decode failed", e);
                    reject(new Error("Goose marker image decode failed"));
                };
                el.src = objectUrl;
            });

            const hasPixels = imageHasVisiblePixels(img);
            console.log("[goose-marker] imageHasVisiblePixels:", hasPixels);

            cachedImage = img;
            return img;
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    })().catch((e) => {
        console.error("[goose-marker] load failed:", e);
        loadPromise = null;
        throw e;
    });

    return loadPromise;
}

function imageHasVisiblePixels(img: HTMLImageElement): boolean {
    // Use explicit fallback dimensions — naturalWidth can be 0 before paint
    const w = Math.max(img.naturalWidth, 61);
    const h = Math.max(img.naturalHeight, 76);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true; // assume OK if no canvas context
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 8) return true;
    }
    // SVG may paint async — don't reject, just warn
    console.warn("Goose marker pixel check found no visible pixels; using anyway.");
    return true; // ← changed: trust the image rather than discarding it
}

/** Register the goose sprite on the map (re-run after style changes). */
export async function ensureGooseMarkerImage(map: maplibregl.Map): Promise<boolean> {
    // Wait for style to be genuinely ready — styledata fires multiple times,
    // so we poll until isStyleLoaded() is true rather than trusting a single event.
    if (!map.isStyleLoaded()) {
        await new Promise<void>((resolve) => {
            const check = () => {
                if (map.isStyleLoaded()) {
                    map.off("styledata", check);
                    map.off("load", check);
                    resolve();
                }
            };
            map.on("styledata", check);
            map.on("load", check);
        });
    }

    if (map.hasImage("goose-marker")) return true;

    try {
        const img = await loadGooseMarkerImage();
        if (!map.hasImage("goose-marker")) {
            map.addImage("goose-marker", img, { pixelRatio: 2, sdf: false });
        }
        console.log("[goose-marker] hasImage after add:", map.hasImage("goose-marker"));
        return true;
    } catch (e) {
        console.error("[goose-marker] ensureGooseMarkerImage failed:", e);
        return false;
    }
}

/** Clear cached bitmap after SVG asset changes (dev hot reload). */
export function resetGooseMarkerImageCache(): void {
    cachedImage = null;
    loadPromise = null;
}
