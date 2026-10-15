import Link from "next/link";
import { cn } from "@/lib/utils";

interface PrimaryCTAProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Full width on phones, natural width from the sm breakpoint. */
  block?: boolean;
  variant?: "primary" | "ghost" | "ghost-on-dark";
}

/** The one filled orange action per page ("Apply now", "Check if you qualify"…). Min 48px tall. */
export function PrimaryCTA({ href, children, className, block = false, variant = "primary" }: PrimaryCTAProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "primary" && "bg-accent-700 text-white hover:bg-accent-800 focus-visible:ring-accent-700",
        variant === "ghost" && "border-2 border-primary-800 text-primary-800 hover:bg-primary-50 focus-visible:ring-primary-800",
        variant === "ghost-on-dark" && "border-2 border-white/70 text-white hover:bg-white/10 focus-visible:ring-white",
        block && "w-full sm:w-auto",
        className,
      )}
    >
      {children}
    </Link>
  );
}
