import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * "on-light"  — white/light background (header scrolled, login, sidebar)
 * "on-dark"   — dark/navy background (transparent hero header, footer)
 */
type LogoVariant = "on-light" | "on-dark";

interface LogoProps {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  linked?: boolean;
}

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 34, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
};

function LogoMark({ variant = "on-light", size = "md", className }: Omit<LogoProps, "linked">) {
  const { icon, text } = sizes[size];

  return (
    <span className={cn("flex items-center gap-2.5 shrink-0", className)}>
      {/* Icon — favicon PNG in a rounded container */}
      <span
        className={cn(
          "flex items-center justify-center rounded-xl shrink-0 overflow-hidden transition-all duration-300",
          variant === "on-dark"
            ? "bg-white/15 ring-1 ring-white/30 backdrop-blur-sm shadow-sm"
            : "bg-neutral-100"
        )}
        style={{ width: icon, height: icon }}
        aria-hidden="true"
      >
        <Image
          src="/icon.png"
          alt=""
          width={icon}
          height={icon}
          className="object-contain"
          style={{ width: icon - 6, height: icon - 6 }}
          priority
        />
      </span>

      {/* Wordmark */}
      <span
        className={cn(
          "font-heading font-bold tracking-tight leading-none",
          text,
          variant === "on-dark" ? "text-white" : "text-primary-800"
        )}
      >
        Skills<span className="text-accent">Air</span>
      </span>
    </span>
  );
}

export function Logo({ variant = "on-light", size = "md", className, linked = true }: LogoProps) {
  if (!linked) {
    return <LogoMark variant={variant} size={size} className={className} />;
  }

  return (
    <Link href="/" aria-label="SkillsAir home" className="shrink-0">
      <LogoMark variant={variant} size={size} className={className} />
    </Link>
  );
}
