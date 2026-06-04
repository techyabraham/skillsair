"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useEnrolledCourses, useCertificates } from "@/hooks/useStudent";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LevelBadge } from "@/components/ui/Badge";
import { DashboardCourseSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn, formatDuration } from "@/lib/utils";
import type { EnrolledCourse, Certificate } from "@/types/course";

type CourseFilter = "all" | "in-progress" | "completed" | "not-started";

export function MyCourses() {
  const { user } = useAuth();
  const { enrolledCourses, isLoading } = useEnrolledCourses(user?.id ?? null);
  const { certificates } = useCertificates(user?.id ?? null);
  const [activeFilter, setActiveFilter] = useState<CourseFilter>("all");

  // Build lookup: courseSlug → Certificate (for courses that have earned certs)
  const certBySlug = new Map<string, Certificate>(
    certificates.map((c) => [c.courseSlug, c])
  );

  const filters: { value: CourseFilter; label: string }[] = [
    { value: "all", label: "All Courses" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "not-started", label: "Not Started" },
  ];

  const filtered = enrolledCourses.filter((c) => {
    if (activeFilter === "in-progress") return c.progress > 0 && c.progress < 100;
    if (activeFilter === "completed") return c.progress === 100;
    if (activeFilter === "not-started") return c.progress === 0;
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">My Courses</h1>
          <p className="text-neutral-500 text-sm mt-1">{enrolledCourses.length} courses enrolled</p>
        </div>
        <Link href="/courses">
          <Button variant="accent" size="md">+ Browse More</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit mb-8 flex-wrap">
        {filters.map((f) => {
          const count = enrolledCourses.filter((c) => {
            if (f.value === "in-progress") return c.progress > 0 && c.progress < 100;
            if (f.value === "completed") return c.progress === 100;
            if (f.value === "not-started") return c.progress === 0;
            return true;
          }).length;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                activeFilter === f.value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 text-xs", activeFilter === f.value ? "text-neutral-500" : "text-neutral-400")}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DashboardCourseSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold text-neutral-700">No courses here yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            {activeFilter === "all" ? "Enroll in a course to get started" : `No ${activeFilter.replace("-", " ")} courses`}
          </p>
          {activeFilter === "all" && (
            <Link href="/courses" className="mt-4 inline-block">
              <Button variant="accent" size="md">Browse Courses</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              certificate={certBySlug.get(course.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  certificate,
}: {
  course: EnrolledCourse;
  certificate?: Certificate;
}) {
  const isCompleted = course.progress === 100;
  const notStarted = course.progress === 0;
  const hasCertificate = Boolean(certificate);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-card-hover transition-all duration-300 flex flex-col">
      <div className="relative h-40">
        <Image
          src={course.thumbnail || "/images/course-placeholder.jpg"}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <LevelBadge level={course.level} size="sm" />
          <span className="text-xs text-neutral-400">
            {course.totalLessons} lessons • {formatDuration(course.duration)}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-neutral-900 mb-3 line-clamp-2">{course.title}</h3>

        {!notStarted && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-500">Progress</span>
              <span className="text-xs font-semibold text-neutral-700">{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} size="sm" color={isCompleted ? "success" : "primary"} />
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-neutral-100 space-y-2">
          {/* Continue / Review row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {isCompleted
                ? "Completed"
                : notStarted
                ? "Not started"
                : `${course.completedLessons.length} of ${course.totalLessons} lessons`}
            </span>
            <Link href={`/dashboard/courses/${course.slug}/learn`}>
              <Button variant={notStarted ? "accent" : "primary"} size="sm">
                {isCompleted ? "Retake Course" : notStarted ? "Start" : "Continue"}
              </Button>
            </Link>
          </div>

          {/* Certificate row — only for completed courses */}
          {isCompleted && (
            hasCertificate && certificate ? (
              <a
                href={certificate.certificateUrl}
                download
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold hover:bg-success/15 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Certificate
              </a>
            ) : (
              <Link
                href={`/checkout?type=certificate&course=${course.slug}&courseName=${encodeURIComponent(course.title)}`}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Get Certificate
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
