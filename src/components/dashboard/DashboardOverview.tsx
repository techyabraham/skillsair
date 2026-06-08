"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEnrolledCourses, useStudentStats } from "@/hooks/useStudent";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DashboardCourseSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";

const STAT_CARDS = [
  {
    key: "totalEnrolled" as const,
    label: "Courses Enrolled",
    icon: "📚",
    color: "bg-primary-50 text-primary-800",
    iconBg: "bg-primary-100",
  },
  {
    key: "totalCompleted" as const,
    label: "Completed",
    icon: "✅",
    color: "bg-success-light text-success-dark",
    iconBg: "bg-success-light",
  },
  {
    key: "totalCertificates" as const,
    label: "Certificates",
    icon: "🏆",
    color: "bg-warning-light text-warning-dark",
    iconBg: "bg-warning-light",
  },
  {
    key: "totalWatchedHours" as const,
    label: "Hours Watched",
    icon: "⏱️",
    color: "bg-accent-100 text-accent-700",
    iconBg: "bg-accent-100",
  },
];

export function DashboardOverview() {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useStudentStats(user?.id ?? null);
  const { enrolledCourses, isLoading: coursesLoading } = useEnrolledCourses(user?.id ?? null);

  const inProgress = enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100);
  const notStarted = enrolledCourses.filter((c) => c.progress === 0);
  // Show in-progress first; fall back to not-started so admin-enrolled users see their courses
  const coursesToShow = inProgress.length > 0 ? inProgress : notStarted;

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-900">
          {timeOfDay()}, {user?.firstName || "Learner"} 👋
        </h1>
        <p className="text-neutral-500 mt-1">
          {inProgress.length > 0
            ? `You have ${inProgress.length} course${inProgress.length > 1 ? "s" : ""} in progress. Keep going!`
            : enrolledCourses.length > 0
            ? `You have ${enrolledCourses.length} course${enrolledCourses.length > 1 ? "s" : ""} enrolled. Ready to start?`
            : "Start your learning journey today."}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-card"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.iconBg}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {statsLoading ? "—" : formatNumber(stats[card.key])}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Enrolled Courses */}
      <section className="mb-10" aria-labelledby="in-progress-heading">
        <div className="flex items-center justify-between mb-5">
          <h2 id="in-progress-heading" className="text-lg font-heading font-semibold text-neutral-900">
            {inProgress.length > 0 ? "Continue Learning" : enrolledCourses.length > 0 ? "My Enrolled Courses" : "Continue Learning"}
          </h2>
          <Link href="/dashboard/courses" className="text-sm text-primary-800 font-medium hover:underline">
            View all
          </Link>
        </div>

        {coursesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardCourseSkeleton key={i} />
            ))}
          </div>
        ) : coursesToShow.length > 0 ? (
          <div className="space-y-3">
            {coursesToShow.slice(0, 4).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.slug}/learn`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-neutral-100 p-4 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={course.thumbnail || "/images/course-placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-800 transition-colors">
                    {course.title}
                  </p>
                  {course.progress > 0 ? (
                    <>
                      <div className="mt-2">
                        <ProgressBar value={course.progress} size="xs" color="primary" />
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">{course.progress}% complete</p>
                    </>
                  ) : (
                    <p className="text-xs text-neutral-400 mt-1">Not started yet</p>
                  )}
                </div>
                <div className="shrink-0">
                  <span className="text-xs font-medium text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg group-hover:bg-primary-800 group-hover:text-white transition-all">
                    {course.progress > 0 ? "Continue →" : "Start →"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-semibold text-neutral-700">No courses enrolled yet</p>
            <p className="text-sm text-neutral-400 mt-1">Browse our catalog to find your next course</p>
            <Link href="/courses" className="mt-4 inline-block">
              <Button variant="accent" size="md">Browse Courses</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-lg font-heading font-semibold text-neutral-900 mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/courses", label: "Browse Courses", icon: "🔍" },
            { href: "/dashboard/certificates", label: "My Certificates", icon: "🏆" },
            { href: "/dashboard/subscription", label: "Manage Plan", icon: "💳" },
            { href: "/dashboard/profile", label: "Edit Profile", icon: "👤" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-neutral-100 hover:shadow-card-hover hover:border-primary-100 transition-all duration-300 text-center group"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-neutral-700 group-hover:text-primary-800 transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
