import React from "react";
import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  alt?: string;
}

const sizeConfig = {
  xs: { container: "w-6 h-6", text: "text-xs" },
  sm: { container: "w-8 h-8", text: "text-sm" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-12 h-12", text: "text-base" },
  xl: { container: "w-16 h-16", text: "text-lg" },
  "2xl": { container: "w-24 h-24", text: "text-2xl" },
};

const bgColors = [
  "bg-primary-800",
  "bg-accent-500",
  "bg-brand-purple",
  "bg-success-dark",
  "bg-warning-dark",
];

function getColorFromName(name: string): string {
  const index =
    name.charCodeAt(0) % bgColors.length;
  return bgColors[index];
}

export function Avatar({ src, name = "", size = "md", className, alt }: AvatarProps) {
  const { container, text } = sizeConfig[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden shrink-0", container, className)}>
        <Image
          src={src}
          alt={alt || name || "Avatar"}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 font-semibold text-white select-none",
        container,
        bgColor,
        text,
        className
      )}
      aria-label={name || "User avatar"}
    >
      {initials || "U"}
    </div>
  );
}
