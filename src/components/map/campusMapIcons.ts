import type { ExpressionSpecification } from "maplibre-gl";

type IconSpec = {
  id: string;
  label: string;
  bg: string;
  fg?: string;
  size?: number;
};

const ICON_SPECS: IconSpec[] = [
  { id: "campus-parking", label: "P", bg: "#2563eb" },
  { id: "campus-bus", label: "B", bg: "#2563eb" },
  { id: "campus-landmark", label: "★", bg: "#4f2683" },
  { id: "campus-food", label: "F", bg: "#ea580c" },
  { id: "campus-residence", label: "R", bg: "#7c3aed" },
  { id: "campus-athletics", label: "A", bg: "#059669" },
  { id: "campus-road", label: "#", bg: "#ca8a04", fg: "#1c1917", size: 22 },
  { id: "campus-campus", label: "W", bg: "#4f2683", size: 28 },
];

function drawMarkerIcon(spec: IconSpec): ImageData {
  const size = spec.size ?? 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const r = size / 2;
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.fillStyle = spec.bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = spec.fg ?? "#ffffff";
  ctx.font = `bold ${Math.round(size * 0.48)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(spec.label, r, r + 0.5);

  return ctx.getImageData(0, 0, size, size);
}

export async function registerCampusMapIcons(map: maplibregl.Map): Promise<void> {
  for (const spec of ICON_SPECS) {
    if (map.hasImage(spec.id)) continue;
    const image = drawMarkerIcon(spec);
    map.addImage(spec.id, image, { pixelRatio: 2 });
  }
}

/** MapLibre `icon-image` expression keyed by POI `kind` */
export const CAMPUS_ICON_IMAGE: ExpressionSpecification = [
  "match",
  ["get", "kind"],
  "parking",
  "campus-parking",
  "bus",
  "campus-bus",
  "food",
  "campus-food",
  "residence",
  "campus-residence",
  "athletics",
  "campus-athletics",
  "road",
  "campus-road",
  "campus",
  "campus-campus",
  "campus-landmark",
];
