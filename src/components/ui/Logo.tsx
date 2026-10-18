import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SkillsAir logo: the three-bar icon (green, yellow, red) beside the wordmark, "Skills" in navy
 * (white on dark) + "Air" in orange, Space Grotesk bold. The same icon is the favicon
 * (src/app/icon.png, favicon.ico, apple-icon.png).
 * "on-light" for white backgrounds, "on-dark" for navy (footer).
 */
type LogoVariant = "on-light" | "on-dark";

interface LogoProps {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  linked?: boolean;
}

const sizes = { sm: "text-lg gap-1.5", md: "text-[22px] gap-2", lg: "text-[26px] gap-2.5" };
const iconSizes = { sm: "h-[18px] w-[18px]", md: "h-[22px] w-[22px]", lg: "h-[26px] w-[26px]" };

/** The three bars, drawn as SVG so they stay sharp at any size. */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false" className={className}>
      <rect x="8" y="58" width="498" height="92" rx="30" fill="#339900" />
      <rect x="8" y="208" width="498" height="92" rx="30" fill="#FFD600" />
      <rect x="8" y="357" width="498" height="92" rx="30" fill="#D50000" />
    </svg>
  );
}

function LogoMark({ variant = "on-light", size = "md", className }: Omit<LogoProps, "linked">) {
  return (
    <span className={cn("inline-flex shrink-0 items-center font-bold leading-none tracking-tight", sizes[size], variant === "on-dark" ? "text-white" : "text-navy", className)}>
      <LogoIcon className={cn("shrink-0", iconSizes[size])} />
      <span>
        Skills<span className={variant === "on-dark" ? "text-accent" : "text-accent-700"}>Air</span>
      </span>
    </span>
  );
}

export function Logo({ variant = "on-light", size = "md", className, linked = true }: LogoProps) {
  if (!linked) return <LogoMark variant={variant} size={size} className={className} />;
  return (
    <Link href="/" aria-label="SkillsAir home" className="shrink-0 no-underline">
      <LogoMark variant={variant} size={size} className={className} />
    </Link>
  );
}
