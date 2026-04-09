"use client";

import { useRef } from "react";
import type maplibregl from "maplibre-gl";

export function useMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  return mapRef;
}
