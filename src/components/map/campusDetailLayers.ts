import type { AddLayerObject } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import type { FilterSpecification } from "maplibre-gl";
import { MAP_TEXT_FONT_BOLD, MAP_TEXT_FONT_REGULAR } from "@/lib/mapStyle";
import { CAMPUS_ICON_IMAGE, registerCampusMapIcons } from "./campusMapIcons";

const POI_DATA_URL = "/data/western-campus-pois.geojson";

function kindFilter(kinds: string[]): FilterSpecification {
  return ["in", ["get", "kind"], ["literal", kinds]];
}

export async function ensureCampusDetailLayers(map: maplibregl.Map): Promise<void> {
  if (map.getSource("western-campus-pois")) return;

  await registerCampusMapIcons(map);

  map.addSource("western-campus-pois", {
    type: "geojson",
    data: POI_DATA_URL,
  });

  // Campus title (Western University)
  map.addLayer({
    id: "western-campus-title",
    type: "symbol",
    source: "western-campus-pois",
    filter: ["==", ["get", "kind"], "campus"],
    minzoom: 12,
    layout: {
      "text-field": ["get", "name"],
      "text-font": [...MAP_TEXT_FONT_BOLD],
      "text-size": ["interpolate", ["linear"], ["zoom"], 12, 14, 15, 20],
      "text-anchor": "center",
      "text-offset": [0, -2.2],
      "icon-image": "campus-campus",
      "icon-size": 1.1,
      "icon-allow-overlap": true,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#4f2683",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2,
    },
  } as AddLayerObject);

  // Road name + optional highway number shield
  map.addLayer({
    id: "western-road-labels",
    type: "symbol",
    source: "western-campus-pois",
    filter: ["==", ["get", "kind"], "road"],
    minzoom: 13,
    layout: {
      "text-field": [
        "case",
        ["all", ["has", "ref"], ["!=", ["get", "ref"], ""]],
        ["concat", ["get", "name"], "\n", ["get", "ref"]],
        ["get", "name"],
      ],
      "text-font": [...MAP_TEXT_FONT_BOLD],
      "text-size": 11,
      "text-anchor": "top",
      "icon-image": [
        "case",
        ["all", ["has", "ref"], ["!=", ["get", "ref"], ""]],
        "campus-road",
        ["literal", ""],
      ],
      "icon-size": 0.75,
      "icon-allow-overlap": false,
    },
    paint: {
      "text-color": "#422006",
      "text-halo-color": "#fef9c3",
      "text-halo-width": 1.5,
    },
  } as AddLayerObject);

  // POI icons (parking, bus, landmarks, etc.)
  map.addLayer({
    id: "western-campus-poi-icons",
    type: "symbol",
    source: "western-campus-pois",
    filter: ["!", ["in", ["get", "kind"], ["literal", ["campus", "road"]]]],
    minzoom: 14,
    layout: {
      "icon-image": CAMPUS_ICON_IMAGE,
      "icon-size": 0.95,
      "icon-allow-overlap": true,
      "icon-ignore-placement": false,
    },
  } as AddLayerObject);

  // POI name labels — icon carries meaning (P = parking, B = bus, etc.)
  map.addLayer({
    id: "western-campus-poi-labels",
    type: "symbol",
    source: "western-campus-pois",
    filter: kindFilter([
      "parking",
      "bus",
      "landmark",
      "food",
      "residence",
      "athletics",
    ]),
    minzoom: 14.5,
    layout: {
      "text-field": ["get", "name"],
      "text-font": [...MAP_TEXT_FONT_REGULAR],
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 0.9],
      "text-max-width": 9,
      "text-optional": true,
    },
    paint: {
      "text-color": "#1f2937",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  } as AddLayerObject);
}
