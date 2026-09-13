"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const onMap = pathname === "/map";

    return (
        <header className="relative z-50">
            {!onMap && <div className="h-14 md:h-18" aria-hidden />}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 py-3 md:px-6 md:py-3">
                <div className="pointer-events-auto relative mx-auto flex w-full max-w-2xl min-w-0 items-center justify-between overflow-hidden rounded-full border border-white/45 bg-white/70 px-3 py-1 shadow-[0_10px_35px_rgba(0,0,0,0.12)] backdrop-blur-md supports-backdrop-filter:bg-white/60 md:px-3 md:py-1">
                    <Link href="/" className="flex min-w-0 shrink items-center gap-2 md:gap-2.5">
                        <img
                            src="/gooseLogo.svg"
                            alt=""
                            width={40}
                            height={40}
                            className="size-9 shrink-0 object-contain md:size-10 hover:scale-105 transition-all"
                        />
                        <span className="truncate text-base font-semibold tracking-tight text-black hover:text-western-purple hover:scale-105 transition-all md:text-lg">
                            Western Wingman
                        </span>
                    </Link>
                    <nav className="flex shrink-0 items-center gap-2 text-sm md:gap-4">
                        <Link
                            href="/report"
                            className="hidden font-medium text-neutral-700 hover:text-western-purple hover:scale-105 transition-all sm:inline"
                        >
                            Report Sighting
                        </Link>
                        <Link
                            href="/map"
                            className={cn(
                                "rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition md:px-4 md:py-1.5 bg-western-purple text-white hover:bg-western-purple-dark hover:scale-105"
                            )}
                        >
                            Live Map
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
