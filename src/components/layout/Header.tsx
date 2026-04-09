"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const onMap = pathname === "/map";

  return (
    <header className="px-4 py-3 md:px-6 md:py-3">
      <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-4 rounded-full border border-black/8 bg-white px-4 py-3 shadow-sm md:gap-20 md:px-5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <img
            src="/gooseLogo.svg"
            alt=""
            width={40}
            height={40}
            className="size-9 shrink-0 object-contain md:size-10"
          />
          <span className="flex flex-col leading-tight text-sm font-semibold tracking-tight text-western-purple md:text-sm">
            <span>Western</span>
            <span>Wingman</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm md:gap-3">
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
              "rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition md:px-5 md:py-2.5",
              onMap
                ? "bg-western-purple text-white ring-2 ring-western-purple/30"
                : "bg-western-purple text-white hover:bg-western-purple-dark"
            )}
          >
            Live Map
          </Link>
        </nav>
      </div>
    </header>
  );
}
