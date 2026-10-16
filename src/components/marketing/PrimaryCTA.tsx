import Link from "next/link";
import { cn } from "@/lib/utils";

interface PrimaryCTAProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Full width on phones, natural width from the sm breakpoint. */
  block?: boolean;
  variant?: "primary" | "ghost" | "ghost-on-dark";
  size?: "md" | "lg";
}

/**
 * The one filled orange action per page (design: #c2410c, hover #9a3412, 12px radius,
 * 52px tall, 16px semibold; "lg" is the 60px hero button).
 */
export function PrimaryCTA({ href, children, className, block = false, variant = "primary", size = "md" }: PrimaryCTAProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        size === "md" ? "min-h-[52px] px-7 text-base" : "min-h-[60px] px-9 text-lg",
        variant === "primary" && "bg-accent-700 text-white hover:bg-accent-800 hover:text-white focus-visible:ring-accent-700",
        variant === "ghost" && "border-2 border-navy text-navy hover:bg-neutral-50 focus-visible:ring-navy",
        variant === "ghost-on-dark" && "border-2 border-white/70 text-white hover:bg-white/10 focus-visible:ring-white",
        block && "w-full sm:w-auto",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Design: underlined secondary text link. */
export function GhostLink({ href, children, className, onDark = false }: { href: string; children: React.ReactNode; className?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("font-semibold underline underline-offset-4", onDark ? "text-white hover:text-accent-300" : "text-navy hover:text-primary-800", className)}
    >
      {children}
    </Link>
  );
}
