"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { tutorApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCourse } from "@/hooks/useCourses";
import type { CourseLesson } from "@/types/course";
import Link from "next/link";

interface CoursePlayerProps {
  slug: string;
}

export function CoursePlayer({ slug }: CoursePlayerProps) {
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  const { course, isLoading } = useCourse(slug);
  const curriculum = course?.curriculum ?? [];
  const totalLessons = curriculum.reduce(
    (acc: number, s: { lessons: CourseLesson[] }) => acc + s.lessons.length,
    0
  );
  const progress = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;
  const allLessons = curriculum.flatMap((s: { lessons: CourseLesson[] }) => s.lessons);

  useEffect(() => {
    if (!activeLesson && allLessons.length > 0) {
      setActiveLesson(allLessons[0]);
    }
  }, [activeLesson, allLessons]);

  const handleLessonClick = useCallback((lesson: CourseLesson) => {
    setActiveLesson(lesson);
  }, []);

  const handleMarkComplete = async () => {
    if (!activeLesson || !course?.id) return;
    setMarkingComplete(true);
    try {
      await tutorApi.markLessonComplete(course.id, activeLesson.id);
      setCompletedLessons((prev) => new Set(Array.from(prev).concat(activeLesson.id)));
      addToast({ type: "success", title: "Lesson completed!", message: "Great job! Keep going." });

      // Auto-advance to next lesson
      const allLessons = curriculum.flatMap((s: { lessons: CourseLesson[] }) => s.lessons);
      const idx = allLessons.findIndex((l: CourseLesson) => l.id === activeLesson.id);
      if (idx < allLessons.length - 1) {
        setActiveLesson(allLessons[idx + 1]);
      }
    } catch {
      addToast({ type: "error", title: "Could not save progress", message: "Please try again." });
    } finally {
      setMarkingComplete(false);
    }
  };

  const navigateLesson = (direction: "prev" | "next") => {
    const allLessons = curriculum.flatMap((s: { lessons: CourseLesson[] }) => s.lessons);
    const idx = activeLesson
      ? allLessons.findIndex((l: CourseLesson) => l.id === activeLesson.id)
      : -1;
    const next = direction === "prev" ? allLessons[idx - 1] : allLessons[idx + 1];
    if (next) setActiveLesson(next);
  };

  const currentIdx = activeLesson
    ? allLessons.findIndex((l: CourseLesson) => l.id === activeLesson.id)
    : -1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col" style={{ paddingTop: 0 }}>
      {/* Top Bar */}
      <div className="bg-neutral-900 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/courses" className="text-white/60 hover:text-white transition-colors shrink-0" aria-label="Back to My Courses">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{course?.title || "Loading..."}</p>
            {activeLesson && (
              <p className="text-white/40 text-xs truncate">{activeLesson.title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 w-40">
            <ProgressBar value={progress} size="xs" color="success" />
            <span className="text-white/50 text-xs">{progress}%</span>
          </div>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Video + Content area */}
        <div className="flex-1 flex flex-col">
          {/* Video player */}
          <div className="bg-black aspect-video w-full max-h-[calc(100vh-200px)] flex items-center justify-center">
            {activeLesson?.videoUrl ? (
              isEmbed(activeLesson.videoUrl) ? (
                <iframe
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`Video: ${activeLesson.title}`}
                />
              ) : (
                <video
                  key={activeLesson.id}
                  src={playableVideoUrl(activeLesson.videoUrl)}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full"
                  aria-label={`Video: ${activeLesson.title}`}
                />
              )
            ) : (
              <div className="text-center text-white/40">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">
                  {activeLesson ? "Video not available" : "Select a lesson to start learning"}
                </p>
              </div>
            )}
          </div>

          {/* Lesson Controls */}
          <div className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateLesson("prev")}
              disabled={currentIdx <= 0}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </Button>

            {activeLesson && !completedLessons.has(activeLesson.id) ? (
              <Button
                variant="success"
                size="sm"
                onClick={handleMarkComplete}
                loading={markingComplete}
                className="bg-success text-white hover:bg-success-dark"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Mark as Complete
              </Button>
            ) : activeLesson ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed
              </div>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateLesson("next")}
              disabled={currentIdx === allLessons.length - 1}
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Next
            </Button>
          </div>

          {/* Lesson Content */}
          {activeLesson && (
            <div className="bg-white px-6 py-6 flex-1 overflow-auto">
              <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">{activeLesson.title}</h2>
              {activeLesson.content ? (
                <div
                  className="prose prose-sm max-w-none text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              ) : (
                <p className="text-sm text-neutral-500">No written lesson notes were added for this lesson.</p>
              )}
              {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Lesson materials</h3>
                  <div className="space-y-2">
                    {activeLesson.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 hover:border-primary-200 hover:text-primary-800 transition-colors"
                      >
                        <span className="truncate">{attachment.title}</span>
                        <span className="text-xs font-medium">Open</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lesson Sidebar */}
        <div
          className={cn(
            "bg-white border-l border-neutral-100 flex flex-col overflow-hidden transition-all duration-300",
            sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0"
          )}
        >
          {sidebarOpen && (
            <>
              <div className="p-4 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-900">Course Content</p>
                <div className="mt-2">
                  <ProgressBar value={progress} size="xs" showLabel label="" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {completedLessons.size}/{totalLessons} lessons completed
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CurriculumAccordion
                  sections={curriculum}
                  activeLesson={activeLesson?.id}
                  onLessonClick={handleLessonClick}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function isEmbed(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url) || url.trim().startsWith("<iframe");
}

function playableVideoUrl(url: string): string {
  if (/\/wp-admin\/admin-ajax\.php/.test(url) && url.includes("igd_stream")) {
    return `/api/media/tutor-video?url=${encodeURIComponent(url)}`;
  }
  return url;
}
