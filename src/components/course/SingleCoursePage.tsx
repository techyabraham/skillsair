"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { CurriculumAccordion } from "./CurriculumAccordion";
import { StarRating } from "@/components/ui/StarRating";
import { LevelBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCourse } from "@/hooks/useCourses";
import {
  formatPrice,
  formatDate,
  formatNumber,
  cn,
} from "@/lib/utils";
import type { Course } from "@/types/course";
import type { Certificate, EnrolledCourse } from "@/types/course";

interface SingleCoursePageProps {
  slug: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Request failed");
  return res.json();
});

function normalizeIdentity(value = ""): string {
  return value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, "");
}

function findEnrollment(course: Course | undefined, enrollments: EnrolledCourse[]): EnrolledCourse | null {
  if (!course) return null;
  return enrollments.find((item) =>
    item.id === course.id ||
    normalizeIdentity(item.slug) === normalizeIdentity(course.slug) ||
    normalizeIdentity(item.title) === normalizeIdentity(course.title)
  ) || null;
}

function findCertificate(
  course: Course | undefined,
  enrollment: EnrolledCourse | null,
  certificates: Certificate[]
): Certificate | null {
  if (!course) return null;
  return certificates.find((cert) =>
    cert.courseId === course.id ||
    cert.courseId === enrollment?.id ||
    normalizeIdentity(cert.courseName) === normalizeIdentity(course.title) ||
    normalizeIdentity(cert.courseName) === normalizeIdentity(enrollment?.title || "")
  ) || null;
}

export function SingleCoursePage({ slug }: SingleCoursePageProps) {
  const { isAuthenticated, user } = useAuth();
  const enrolling = false;
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "instructor" | "reviews">("overview");

  const { course, isLoading, error } = useCourse(slug);
  const { data: enrollments = [] } = useSWR<EnrolledCourse[]>(
    isAuthenticated && user ? `/api/students/${user.id}/courses` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: certificates = [] } = useSWR<Certificate[]>(
    isAuthenticated && user ? `/api/students/${user.id}/certificates` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const enrollment = findEnrollment(course, enrollments);
  const certificate = findCertificate(course, enrollment, certificates);
  const progress = Math.min(100, Math.max(0, enrollment?.progress ?? 0));
  const courseActionLabel = enrollment
    ? progress >= 100
      ? "Retake Course"
      : progress > 0
        ? "Continue Learning"
        : "Start Learning"
    : course?.isFree
      ? "Enroll for Free"
      : "Enroll Now";
  const courseActionHref = enrollment ? `/dashboard/courses/${slug}/learn` : `/checkout?course=${slug}`;
  const certificateHref = certificate?.certificateUrl || `/checkout?certificate=${slug}`;

  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">Course not found.</p>
          <Link href="/courses" className="text-primary-800 font-medium mt-2 inline-block">
            Browse all courses
          </Link>
        </div>
      </div>
    );
  }

  const handleEnroll = () => {
    window.location.href = `/checkout?course=${slug}`;
  };

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "curriculum" as const, label: "Curriculum" },
    { id: "instructor" as const, label: "Instructor" },
    { id: "reviews" as const, label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-navy text-white pt-24 pb-8">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton rounded className="h-6 w-32" />
                  <Skeleton rounded className="h-10 w-full" />
                  <Skeleton rounded className="h-10 w-3/4" />
                  <Skeleton rounded className="h-5 w-2/3" />
                </div>
              ) : course ? (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="flex items-center gap-2 mb-4">
                    {course.categories[0] && (
                      <span className="text-accent text-sm font-medium">{course.categories[0].name}</span>
                    )}
                    <span className="text-white/30">•</span>
                    <LevelBadge level={course.level} />
                  </div>

                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold leading-tight mb-4">
                    {course.title}
                  </h1>

                  <p className="text-white/70 text-base leading-relaxed mb-5">
                    {course.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-warning">{course.rating.average.toFixed(1)}</span>
                      <StarRating rating={course.rating.average} size="sm" />
                      <span className="text-white/50">({formatNumber(course.rating.count)} ratings)</span>
                    </div>
                    <span className="text-white/50">•</span>
                    <span className="text-white/70">{formatNumber(course.totalStudents)} students</span>
                    <span className="text-white/50">•</span>
                    <span className="text-white/70">{course.language}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <Avatar src={course.instructor.avatar} name={course.instructor.name} size="sm" />
                    <div>
                      <span className="text-xs text-white/50">Created by </span>
                      <span className="text-sm font-medium text-white">{course.instructor.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Last updated {course.lastUpdated ? formatDate(course.lastUpdated) : "Recently"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 3.038A2 2 0 0112 11m0 0v5m0 0a2 2 0 100 4 2 2 0 000-4" />
                      </svg>
                      {course.language}
                    </span>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="container-wide">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200",
                  activeTab === tab.id
                    ? "border-primary-800 text-primary-800"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content + Sticky Sidebar */}
      <div className="container-wide py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} rounded className="h-32 w-full" />
                ))}
              </div>
            ) : course ? (
              <>
                {/* What you'll learn */}
                {activeTab === "overview" && course.outcomes.length > 0 && (
                  <section aria-labelledby="outcomes-heading">
                    <h2 id="outcomes-heading" className="text-xl font-heading font-bold text-neutral-900 mb-5">
                      What You&apos;ll Learn
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                      {course.outcomes.map((outcome, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-neutral-700">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Description */}
                {activeTab === "overview" && (
                  <section aria-labelledby="description-heading">
                    <h2 id="description-heading" className="text-xl font-heading font-bold text-neutral-900 mb-4">
                      Course Description
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-neutral-600"
                      dangerouslySetInnerHTML={{ __html: course.description || course.excerpt }}
                    />
                  </section>
                )}

                {/* Requirements */}
                {activeTab === "overview" && course.requirements.length > 0 && (
                  <section aria-labelledby="requirements-heading">
                    <h2 id="requirements-heading" className="text-xl font-heading font-bold text-neutral-900 mb-4">
                      Requirements
                    </h2>
                    <ul className="space-y-2">
                      {course.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-1.5" aria-hidden="true" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Curriculum */}
                {activeTab === "curriculum" && (
                  <section aria-labelledby="curriculum-heading">
                    <h2 id="curriculum-heading" className="text-xl font-heading font-bold text-neutral-900 mb-5">
                      Course Curriculum
                    </h2>
                    {course.curriculum.length > 0 ? (
                      <CurriculumAccordion sections={course.curriculum} showPreviewOnly />
                    ) : (
                      <p className="text-neutral-400 text-sm">Curriculum details will be available soon.</p>
                    )}
                  </section>
                )}

                {/* Instructor */}
                {activeTab === "instructor" && (
                  <section aria-labelledby="instructor-heading">
                    <h2 id="instructor-heading" className="text-xl font-heading font-bold text-neutral-900 mb-5">
                      Your Instructor
                    </h2>
                    <div className="flex items-start gap-5">
                      <Avatar src={course.instructor.avatar} name={course.instructor.name} size="xl" />
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">{course.instructor.name}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <span className="text-warning">⭐</span>
                            {course.instructor.rating.toFixed(1)} Rating
                          </span>
                          <span>{formatNumber(course.instructor.totalStudents)} Students</span>
                          <span>{course.instructor.totalCourses} Courses</span>
                        </div>
                        <p className="text-sm text-neutral-600 mt-4 leading-relaxed max-w-2xl">
                          {course.instructor.bio || "Expert instructor with years of industry experience."}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && (
                  <section aria-labelledby="reviews-heading">
                    <h2 id="reviews-heading" className="text-xl font-heading font-bold text-neutral-900 mb-5">
                      Student Reviews
                    </h2>
                    <div className="flex items-center gap-6 mb-8 p-6 bg-neutral-50 rounded-2xl">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-neutral-900">{course.rating.average.toFixed(1)}</p>
                        <StarRating rating={course.rating.average} size="md" className="justify-center mt-1" />
                        <p className="text-xs text-neutral-400 mt-1">Course Rating</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-warning h-full rounded-full" style={{ width: "70%" }} />
                            </div>
                            <span className="text-xs text-neutral-400 w-4 text-right">{star}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {course.reviews.length === 0 && (
                      <p className="text-neutral-400 text-sm">No reviews yet. Be the first to review this course!</p>
                    )}
                  </section>
                )}
              </>
            ) : null}
          </div>

          {/* Right: Sticky Enroll Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              {isLoading ? (
                <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton rounded className="h-8 w-32" />
                    <Skeleton rounded className="h-12 w-full" />
                    <Skeleton rounded className="h-5 w-full" />
                    <Skeleton rounded className="h-5 w-3/4" />
                  </div>
                </div>
              ) : course ? (
                <EnrollSidebar
                  course={course}
                  onEnroll={handleEnroll}
                  enrolling={enrolling}
                  isAuthenticated={isAuthenticated}
                  isEnrolled={Boolean(enrollment)}
                  progress={progress}
                  courseActionLabel={courseActionLabel}
                  courseActionHref={courseActionHref}
                  certificateHref={certificateHref}
                  certificateObtained={Boolean(certificate)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Enroll Bar */}
      {course && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 shadow-modal">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xl font-bold text-neutral-900">
                {course.isFree ? "Free" : formatPrice(course.salePrice ?? course.price)}
              </span>
              {course.salePrice && (
                <span className="text-sm text-neutral-400 line-through ml-2">{formatPrice(course.price)}</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Link href={courseActionHref} className="btn-accent text-center">
                {courseActionLabel}
              </Link>
              {enrollment && progress >= 100 && (
                <a
                  href={certificateHref}
                  target={certificate ? "_blank" : undefined}
                  rel={certificate ? "noopener noreferrer" : undefined}
                  className="btn-outline text-center"
                >
                  {certificate ? "Download Certificate" : "Get Certificate"}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrollSidebar({
  course,
  onEnroll,
  enrolling,
  isAuthenticated,
  isEnrolled,
  progress,
  courseActionLabel,
  courseActionHref,
  certificateHref,
  certificateObtained,
}: {
  course: Course;
  onEnroll: () => void;
  enrolling: boolean;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  progress: number;
  courseActionLabel: string;
  courseActionHref: string;
  certificateHref: string;
  certificateObtained: boolean;
}) {
  const hasDiscount = course.salePrice && course.salePrice < course.price;
  const discountPercent = hasDiscount
    ? Math.round(((course.price - course.salePrice!) / course.price) * 100)
    : 0;

  const courseIncludes = [
    { icon: "🎬", label: `${course.includes.videoHours}h of video content` },
    { icon: "📄", label: `${course.includes.articles} articles & resources` },
    { icon: "⬇️", label: `${course.includes.downloadableResources} downloadable files` },
    { icon: "♾️", label: "Full lifetime access" },
    { icon: "📱", label: "Mobile & desktop access" },
    { icon: "🏆", label: "Certificate of completion" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-card">
      {/* Preview */}
      <div className="relative h-44 bg-neutral-900">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-80" sizes="384px" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
        <button className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform" aria-label="Preview course">
            <svg className="w-6 h-6 text-primary-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
          Preview this course
        </div>
      </div>

      <div className="p-6">
        {/* Price */}
        <div className="flex items-end gap-3 mb-4">
          {course.isFree ? (
            <span className="text-3xl font-bold text-success-dark">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-neutral-900">
                {formatPrice(hasDiscount ? course.salePrice! : course.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-neutral-400 line-through">{formatPrice(course.price)}</span>
                  <span className="text-sm font-bold text-error bg-error-light px-2 py-0.5 rounded-full">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {hasDiscount && (
          <p className="text-xs text-error font-medium mb-4">⏰ Limited time offer!</p>
        )}

        {isEnrolled ? (
          <div className="mb-3 space-y-3">
            <Link href={courseActionHref} className="btn-accent w-full">
              {courseActionLabel}
            </Link>
            {progress >= 100 && (
              <a
                href={certificateHref}
                target={certificateObtained ? "_blank" : undefined}
                rel={certificateObtained ? "noopener noreferrer" : undefined}
                className="btn-outline w-full"
              >
                {certificateObtained ? "Download Certificate" : "Get Certificate"}
              </a>
            )}
          </div>
        ) : (
          <Button variant="accent" size="lg" fullWidth onClick={onEnroll} loading={enrolling} className="mb-3">
            {course.isFree ? "Enroll for Free" : "Enroll Now"}
          </Button>
        )}

        {!isAuthenticated && (
          <p className="text-xs text-neutral-400 text-center mb-4">
            <Link href="/login" className="text-primary-800 hover:underline">Sign in</Link> to enroll
          </p>
        )}

        <p className="text-xs text-neutral-400 text-center mb-6">30-Day Money-Back Guarantee</p>

        {/* Course includes */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-3">This course includes:</h3>
          <ul className="space-y-2.5">
            {courseIncludes.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm text-neutral-600">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Share */}
        <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-center gap-4">
          <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Share</button>
          <span className="text-neutral-200">|</span>
          <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Gift this course</button>
          <span className="text-neutral-200">|</span>
          <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Apply coupon</button>
        </div>
      </div>
    </div>
  );
}
