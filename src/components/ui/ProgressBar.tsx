import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  color?: "primary" | "accent" | "success";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const colorClasses = {
  primary: "bg-primary-800",
  accent: "bg-accent",
  success: "bg-success",
};

const heightClasses = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
};

export function ProgressBar({
  value,
  max = 100,
  size = "sm",
  color = "primary",
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
          {showLabel && (
            <span className="text-xs font-semibold text-neutral-700">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div
        className={cn("w-full bg-neutral-100 rounded-full overflow-hidden", heightClasses[size])}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(percent)}%`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClasses[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
