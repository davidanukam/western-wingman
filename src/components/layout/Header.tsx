"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const onMap = pathname === "/map";

    return (
        <header className="relative z-50">
            <div className="h-14 md:h-18" aria-hidden />
            <div className="fixed inset-x-0 top-0 z-50 px-4 py-3 md:px-6 md:py-3">
                <div className="relative mx-auto flex w-full max-w-2xl items-center justify-between overflow-hidden rounded-full border border-white/45 bg-white/70 px-4 py-1 shadow-[0_10px_35px_rgba(0,0,0,0.12)] backdrop-blur-md supports-backdrop-filter:bg-white/60 md:px-3 md:py-1">
                    <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
                        <img
                            src="/gooseLogo.svg"
                            alt=""
                            width={40}
                            height={40}
                            className="size-9 shrink-0 object-contain md:size-10"
                        />
                        <span className="flex flex-col leading-tight text-lg font-semibold tracking-tight text-western-purple md:text-lg">
                            <span>Western Wingman</span>
                        </span>
                    </Link>
                    <nav className="flex shrink-0 items-center gap-2 text-sm md:gap-4">
                        <Link
                            href="/report"
                            className="hidden font-medium text-neutral-700 hover:text-western-purple sm:inline"
                        >
                            Report Sighting
                        </Link>
                        <Link
                            href="/report"
                            className="font-medium text-neutral-700 hover:text-western-purple sm:hidden"
                            aria-label="Report sighting"
                        >
                            Report
                        </Link>
                        <Link
                            href="/map"
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition md:px-4 md:py-1.5 bg-western-purple text-white hover:bg-western-purple-dark"
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
