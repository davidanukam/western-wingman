"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_STYLE } from "@/lib/mapStyle";
import { attachStyleImageFallback } from "./styleImageFallback";

type MiniMapPickerProps = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
};

export function MiniMapPicker({ lat, lng, onPick }: MiniMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);

  const [initialCenter] = useState(() => ({ lat, lng }));

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 16,
    });

    const marker = new maplibregl.Marker({ color: "#4f2683" })
      .setLngLat([initialCenter.lng, initialCenter.lat])
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;
    const detachImageFallback = attachStyleImageFallback(map);

    map.on("click", (e) => {
      const { lng: glng, lat: glat } = e.lngLat;
      marker.setLngLat([glng, glat]);
      onPickRef.current(glat, glng);
    });

    return () => {
      detachImageFallback();
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialCenter]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const apply = () => {
      marker.setLngLat([lng, lat]);
      map.setCenter([lng, lat]);
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-52 w-full overflow-hidden rounded-xl border border-western-purple/25 shadow-sm"
    />
  );
}
