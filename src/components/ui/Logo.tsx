import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Design wordmark: "Skills" in navy (white on dark) + "Air" in orange, Space Grotesk bold.
 * "on-light" for white backgrounds, "on-dark" for navy (footer).
 */
type LogoVariant = "on-light" | "on-dark";

interface LogoProps {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  linked?: boolean;
}

const sizes = { sm: "text-lg", md: "text-[22px]", lg: "text-[26px]" };

function LogoMark({ variant = "on-light", size = "md", className }: Omit<LogoProps, "linked">) {
  return (
    <span className={cn("shrink-0 font-bold leading-none tracking-tight", sizes[size], variant === "on-dark" ? "text-white" : "text-navy", className)}>
      Skills<span className={variant === "on-dark" ? "text-accent" : "text-accent-700"}>Air</span>
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
