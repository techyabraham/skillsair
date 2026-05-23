import React from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const sizeClasses = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  showCount = false,
  count = 0,
  className,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState(0);
  const displayRating = interactive && hovered > 0 ? hovered : rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const filled = displayRating >= starValue;
          const halfFilled = !filled && displayRating >= starValue - 0.5;

          return (
            <button
              key={i}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onRate?.(starValue)}
              onMouseEnter={() => interactive && setHovered(starValue)}
              onMouseLeave={() => interactive && setHovered(0)}
              className={cn(
                "transition-transform",
                interactive && "hover:scale-110 cursor-pointer",
                !interactive && "cursor-default"
              )}
              aria-label={interactive ? `Rate ${starValue} star${starValue !== 1 ? "s" : ""}` : undefined}
            >
              <svg
                className={cn(
                  sizeClasses[size],
                  filled
                    ? "text-warning fill-warning"
                    : halfFilled
                    ? "text-warning"
                    : "text-neutral-200 fill-neutral-200"
                )}
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {halfFilled ? (
                  <>
                    <defs>
                      <linearGradient id={`half-${i}`}>
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="#e2e8f0" />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#half-${i})`}
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </>
                ) : (
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-neutral-700">{rating.toFixed(1)}</span>
      )}
      {showCount && count > 0 && (
        <span className="text-xs text-neutral-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
