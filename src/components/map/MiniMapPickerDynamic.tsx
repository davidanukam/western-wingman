"use client";

import dynamic from "next/dynamic";

export const MiniMapPickerDynamic = dynamic(
  () => import("./MiniMapPicker").then((m) => m.MiniMapPicker),
  { ssr: false, loading: () => <div className="h-52 w-full animate-pulse rounded-xl bg-muted" /> }
);
