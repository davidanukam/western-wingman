import { cn } from "@/lib/utils";

/** Simple goose silhouette for branding and map markers */
export function GooseLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <ellipse cx="18" cy="24" rx="9" ry="6.5" />
      <circle cx="27" cy="18" r="5.5" />
      <path d="M32.5 17.5 L38 15.5 L36.5 19.5 Z" />
      <path
        d="M10 22 Q6 20 5 24 Q7 27 11 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
