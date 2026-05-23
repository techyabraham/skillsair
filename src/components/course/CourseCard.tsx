import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarRating } from "@/components/ui/StarRating";
import { LevelBadge } from "@/components/ui/Badge";
import { formatPrice, formatDuration, formatNumber, cn } from "@/lib/utils";
import type { Course } from "@/types/course";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "horizontal" | "compact";
  className?: string;
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const hasDiscount = course.salePrice && course.salePrice < course.price;

  if (variant === "horizontal") {
    return (
      <Link href={`/courses/${course.slug}`} className={cn("group flex gap-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover p-4 transition-all duration-300", className)}>
        <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0">
          <Image
            src={course.thumbnail || "/images/course-placeholder.jpg"}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="128px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <LevelBadge level={course.level} />
          <h3 className="text-sm font-semibold text-neutral-900 mt-1.5 line-clamp-2 group-hover:text-primary-800 transition-colors">
            {course.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <StarRating rating={course.rating.average} size="sm" showValue />
            <span className="text-xs text-neutral-400">({formatNumber(course.rating.count)})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {course.isFree ? (
              <span className="text-sm font-bold text-success-dark">Free</span>
            ) : (
              <>
                <span className="text-sm font-bold text-primary-800">
                  {formatPrice(hasDiscount ? course.salePrice! : course.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-neutral-400 line-through">{formatPrice(course.price)}</span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/courses/${course.slug}`} className={cn("group flex items-center gap-3 hover:bg-neutral-50 rounded-xl p-2 transition-all duration-200", className)}>
        <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
          <Image
            src={course.thumbnail || "/images/course-placeholder.jpg"}
            alt={course.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-primary-800 transition-colors">{course.title}</p>
          <p className="text-xs text-neutral-400">{formatPrice(course.price)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/courses/${course.slug}`} className={cn("group card flex flex-col", className)}>
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.thumbnail || "/images/course-placeholder.jpg"}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-error text-white text-xs font-bold px-2 py-1 rounded-lg">
            {Math.round(((course.price - course.salePrice!) / course.price) * 100)}% OFF
          </div>
        )}
        {course.isFree && (
          <div className="absolute top-3 left-3 bg-success text-white text-xs font-bold px-2 py-1 rounded-lg">
            FREE
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-2">
          <LevelBadge level={course.level} size="sm" />
          {course.categories[0] && (
            <span className="text-xs text-neutral-400 truncate">{course.categories[0].name}</span>
          )}
        </div>

        <h3 className="text-base font-heading font-semibold text-neutral-900 line-clamp-2 leading-snug mb-2 group-hover:text-primary-800 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
            <Image
              src={course.instructor.avatar || "/images/avatar-placeholder.jpg"}
              alt={course.instructor.name}
              fill
              className="object-cover"
              sizes="20px"
            />
          </div>
          <span className="text-xs text-neutral-500 truncate">{course.instructor.name}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-bold text-warning-dark">{course.rating.average.toFixed(1)}</span>
          <StarRating rating={course.rating.average} size="sm" />
          <span className="text-xs text-neutral-400">({formatNumber(course.rating.count)})</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(course.duration)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {course.totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {formatNumber(course.totalStudents)}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            {course.isFree ? (
              <span className="text-lg font-bold text-success-dark">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(hasDiscount ? course.salePrice! : course.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-neutral-400 line-through">{formatPrice(course.price)}</span>
                )}
              </>
            )}
          </div>
          <span className="text-xs font-semibold text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg group-hover:bg-primary-800 group-hover:text-white transition-all duration-200">
            Enroll →
          </span>
        </div>
      </div>
    </Link>
  );
}
