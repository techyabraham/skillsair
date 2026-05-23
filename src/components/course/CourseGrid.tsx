import React from "react";
import { CourseCard } from "./CourseCard";
import { CourseCardSkeleton } from "@/components/ui/Skeleton";
import type { Course } from "@/types/course";

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  emptySubtext?: string;
}

export function CourseGrid({
  courses,
  isLoading = false,
  skeletonCount = 6,
  emptyMessage = "No courses found",
  emptySubtext = "Try adjusting your filters or search query.",
}: CourseGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-700">{emptyMessage}</h3>
        <p className="text-sm text-neutral-400 mt-1">{emptySubtext}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
