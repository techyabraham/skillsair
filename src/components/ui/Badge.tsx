import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-100 text-primary-800",
  accent: "bg-accent-100 text-accent-700",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  error: "bg-error-light text-error-dark",
  neutral: "bg-neutral-100 text-neutral-600",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ variant = "neutral", size = "md", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface LevelBadgeProps {
  level: string;
  size?: "sm" | "md";
  className?: string;
}

const levelConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  beginner: { label: "Beginner", variant: "success" },
  intermediate: { label: "Intermediate", variant: "warning" },
  advanced: { label: "Advanced", variant: "error" },
  all: { label: "All Levels", variant: "neutral" },
};

export function LevelBadge({ level, size, className }: LevelBadgeProps) {
  const config = levelConfig[level] ?? { label: level, variant: "neutral" };
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
