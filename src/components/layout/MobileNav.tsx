"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/report", label: "Report", icon: PlusCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium",
                active ? "text-western-purple" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-western-purple")} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
