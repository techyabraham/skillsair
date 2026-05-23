import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({ className, rounded = false, circle = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        circle ? "rounded-full" : rounded ? "rounded-xl" : "rounded",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="w-full h-48" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton rounded className="h-5 w-20" />
          <Skeleton rounded className="h-5 w-16" />
        </div>
        <Skeleton rounded className="h-5 w-full" />
        <Skeleton rounded className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton circle className="w-6 h-6" />
          <Skeleton rounded className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} circle className="w-4 h-4" />
          ))}
          <Skeleton rounded className="h-4 w-12" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton rounded className="h-6 w-20" />
          <Skeleton rounded className="h-8 w-28" />
        </div>
      </div>
    </div>
  );
}

export function DashboardCourseSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100" aria-hidden="true">
      <Skeleton rounded className="w-24 h-16 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton rounded className="h-4 w-3/4" />
        <Skeleton rounded className="h-3 w-1/2" />
        <Skeleton rounded className="h-2 w-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex items-center gap-4">
        <Skeleton circle className="w-20 h-20" />
        <div className="space-y-2">
          <Skeleton rounded className="h-5 w-40" />
          <Skeleton rounded className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton rounded className="h-4 w-20" />
            <Skeleton rounded className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
