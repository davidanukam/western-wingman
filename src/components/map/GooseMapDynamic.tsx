"use client";

import dynamic from "next/dynamic";
import type { GooseMapProps } from "./GooseMap";

const Inner = dynamic(() => import("./GooseMap").then((m) => m.GooseMap), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-60 items-center justify-center bg-neutral-100 text-sm text-neutral-500">
            Loading map…
        </div>
    ),
});

export function GooseMapDynamic(props: GooseMapProps) {
    return <Inner {...props} />;
}
