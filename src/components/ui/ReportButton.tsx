import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReportButton({ className }: { className?: string }) {
  return (
    <Link
      href="/report"
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "rounded-full bg-western-purple px-5 text-primary-foreground shadow-lg hover:bg-western-purple-dark",
        className
      )}
    >
      <Plus className="mr-1 size-4" aria-hidden />
      Report Sighting
    </Link>
  );
}
