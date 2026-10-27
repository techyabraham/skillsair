"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { tutorApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCourse } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { useEnrolledCourses } from "@/hooks/useStudent";
import useSWR from "swr";
import type { CourseLesson } from "@/types/course";
import Link from "next/link";
import { LessonVideoPlayer, type LessonVideoPlayerHandle } from "@/components/dashboard/player/LessonVideoPlayer";
import { TranscriptPanel } from "@/components/dashboard/player/TranscriptPanel";
import { QuizRunner } from "@/components/assessment/QuizRunner";
import { assessmentApi, lagosTime } from "@/lib/assessment-client";
import type { AssessmentQuiz } from "@/types/assessment";
import { guidedPlanOn, naira, site } from "@/content/site";
import { DayCurriculum } from "@/components/dashboard/player/DayCurriculum";
import { DAY_NAME, dayGap, once, planApi, planKeys, STATUS_CHIP, statusLabel } from "@/lib/plan-client";
import { track } from "@/lib/analytics";
import type { CoursePlan, PlanItem } from "@/types/plan";

interface CoursePlayerProps {
  slug: string;
}

export function CoursePlayer({ slug }: CoursePlayerProps) {
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<number | null>(null);
  // Knowledge check under the video, shown when it ends (once per lesson visit).
  const [checkForLesson, setCheckForLesson] = useState<number | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const lastVideoTime = useRef<{ lessonId: number; time: number } | null>(null);
  const playerRef = useRef<LessonVideoPlayerHandle>(null);
  const [position, setPosition] = useState(0);
  const [contentTab, setContentTab] = useState<"notes" | "transcript">("notes");

  const { course, isLoading } = useCourse(slug);
  const { user } = useAuth();
  const { enrolledCourses, refresh: refreshEnrollments } = useEnrolledCourses(user?.id ?? null);
  const enrolledCourse = enrolledCourses.find((item) => item.id === course?.id || item.slug === slug);
  const { data: assessments, error: quizzesLoadError, mutate: refreshAssessments } = useSWR(
    course?.id && enrolledCourse ? `/api/learning/courses/${course.id}/assessments` : null,
    () => assessmentApi.courseAssessments(course!.id),
    { revalidateOnFocus: false },
  );
  // Guided plan: one call powers the day-by-day sidebar, the header and the "2 of 3 done today" toast.
  const { data: plan, mutate: refreshPlan } = useSWR(
    guidedPlanOn && course?.id && enrolledCourse ? planKeys.course(course.id) : null,
    () => planApi.course(course!.id),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  // Chapter-view learners see the existing chapter list, unchanged.
  const guided = plan?.pace === "guided";
  const quizzes: AssessmentQuiz[] = assessments?.quizzes ?? [];
  const chapterQuizzes = quizzes.filter((quiz) => quiz.kind === "chapter");
  const finalExam = quizzes.find((quiz) => quiz.kind === "final_exam");
  const curriculum = course?.curriculum ?? [];
  const totalLessons = curriculum.reduce(
    (acc: number, s: { lessons: CourseLesson[] }) => acc + s.lessons.length,
    0
  );
  const progress = enrolledCourse?.progress ?? (totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0);
  const selectedQuiz = quizzes.find((quiz) => quiz.id === activeQuiz);
  const allLessons = curriculum.flatMap((s: { lessons: CourseLesson[] }) => s.lessons);

  useEffect(() => {
    if (!activeLesson && allLessons.length > 0) {
      setActiveLesson(allLessons[0]);
    }
  }, [activeLesson, allLessons]);

  useEffect(() => {
    setWatchedSeconds(0);
    setPosition(0);
    setContentTab("notes");
    lastVideoTime.current = null;
  }, [activeLesson?.id]);

  // Progress heartbeat: every 30 s, send the watch time so far (not a completion). Skipped when
  // nothing new was watched, so a paused or hidden player sends nothing.
  const watchedRef = useRef(0);
  watchedRef.current = watchedSeconds;
  useEffect(() => {
    if (!course?.id || !activeLesson?.id) return;
    const courseId = course.id;
    const lessonId = activeLesson.id;
    let sent = 0;
    const timer = window.setInterval(() => {
      const seconds = Math.floor(watchedRef.current);
      if (seconds - sent < 5 || document.visibilityState === "hidden") return;
      sent = seconds;
      tutorApi.markLessonComplete(courseId, lessonId, seconds, false).catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [course?.id, activeLesson?.id]);

  useEffect(() => {
    if (enrolledCourse) setCompletedLessons(new Set(enrolledCourse.completedLessons));
  }, [enrolledCourse]);

  const handleLessonClick = useCallback((lesson: CourseLesson) => {
    setActiveQuiz(null);
    setCheckForLesson(null);
    setActiveLesson(lesson);
  }, []);

  /** "Review lesson" / "Rewatch from 04:12" from quiz results. */
  const reviewLesson = useCallback((lessonId: number, seconds: number | null) => {
    const lesson = allLessons.find((item: CourseLesson) => item.id === lessonId);
    if (!lesson) return;
    setActiveQuiz(null);
    setCheckForLesson(null);
    pendingSeek.current = seconds;
    setActiveLesson(lesson);
    window.setTimeout(() => {
      if (pendingSeek.current !== null) playerRef.current?.seek(pendingSeek.current);
      pendingSeek.current = null;
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum]);

  // ?lesson=<id> opens that lesson (links from the exam result and emails).
  useEffect(() => {
    if (!allLessons.length) return;
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("lesson"));
    if (id) reviewLesson(id, null);
    const quizId = Number(params.get("quiz"));
    if (quizId) {
      setCheckForLesson(null);
      setActiveQuiz(quizId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLessons.length]);

  const knowledgeCheck = activeLesson ? quizzes.find((quiz) => quiz.kind === "knowledge_check" && quiz.lessonId === activeLesson.id) : undefined;

  const handleMarkComplete = async () => {
    if (!activeLesson || !course?.id) return;
    setMarkingComplete(true);
    try {
      await tutorApi.markLessonComplete(course.id, activeLesson.id, watchedSeconds);
      setCompletedLessons((prev) => new Set(Array.from(prev).concat(activeLesson.id)));
      await refreshEnrollments();
      addToast({ type: "success", title: "Lesson completed!", message: (await planProgressMessage({ type: "lesson", id: activeLesson.id })) ?? "Great job! Keep going." });

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

  const trackVideoTime = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const previous = lastVideoTime.current;
    if (previous && previous.lessonId === activeLesson?.id && !video.paused) {
      const elapsed = video.currentTime - previous.time;
      if (elapsed > 0 && elapsed <= 2.5) {
        setWatchedSeconds((seconds) => seconds + elapsed);
      }
    }
    lastVideoTime.current = { lessonId: activeLesson?.id ?? 0, time: video.currentTime };
  };

  const navigateLesson = (direction: "prev" | "next") => {
    const allLessons = curriculum.flatMap((s: { lessons: CourseLesson[] }) => s.lessons);
    const idx = activeLesson
      ? allLessons.findIndex((l: CourseLesson) => l.id === activeLesson.id)
      : -1;
    const next = direction === "prev" ? allLessons[idx - 1] : allLessons[idx + 1];
    if (next) setActiveLesson(next);
  };

  /**
   * After a lesson or quiz (guided learners): "2 of 3 done today", "Wednesday done early. You're
   * 1 day ahead of the class." or "Week 5 complete. Week 6 is open."
   */
  const planProgressMessage = async (done: { type: "lesson" | "chapter_quiz"; id: number }): Promise<string | null> => {
    if (!guided || !plan) return null;
    const fresh = ((await refreshPlan().catch(() => undefined)) as CoursePlan | undefined) ?? plan;
    const week = fresh.week;
    const lessons = week.days.flatMap((day) => day.items).filter((item) => item.type !== "final_exam");
    if (!lessons.length) return null;
    if (lessons.every((item) => item.done)) {
      if (once(`sa_plan_week_done:${fresh.courseId}:${week.week}`)) track("plan_week_completed", { week: week.week, course: slug });
      return week.week < fresh.weeks ? `Week ${week.week} complete. Week ${week.week + 1} is open.` : `Week ${week.week} complete. Nice work.`;
    }
    const day = week.days.find((candidate) => candidate.items.some((item) => item.type === done.type && item.id === done.id));
    if (day && (day.state === "done_early" || (day.state === "upcoming" && fresh.status === "ahead"))) {
      if (once(`sa_plan_ahead:${fresh.courseId}:${new Date().toDateString()}`)) track("plan_ahead", { daysAhead: fresh.daysAhead ?? 0, course: slug });
      if (day.state === "done_early" && fresh.daysAhead) return `${DAY_NAME[day.day]} done early. You're ${dayGap(fresh.daysAhead)} ahead of the class.`;
    }
    const today = week.days.find((candidate) => candidate.state === "today");
    const todayLessons = today?.items.filter((item) => item.type !== "final_exam") ?? [];
    if (todayLessons.length) return `${todayLessons.filter((item) => item.done).length} of ${todayLessons.length} done today`;
    return `${lessons.filter((item) => item.done).length} of ${lessons.length} done this week`;
  };

  const planItemDone = (item: PlanItem) =>
    item.type === "lesson" ? item.done || completedLessons.has(item.id) : item.done || Boolean(quizzes.find((quiz) => quiz.id === item.id)?.passed);
  // "Week 5 · Thursday's lesson": the open lesson's planned day (this week, or a catch-up item).
  const plannedForActive = plan && activeLesson
    ? [...plan.week.days.flatMap((day) => day.items), ...(plan.overdue ?? [])].find((item) => item.type === "lesson" && item.id === activeLesson.id)
    : undefined;

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
          <Link href={guided ? `/dashboard/courses/${encodeURIComponent(slug)}/plan` : "/dashboard/courses"} className="text-white/60 hover:text-white transition-colors shrink-0" aria-label={guided ? "Back to this week's plan" : "Back to My Courses"}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{course?.title || "Loading..."}</p>
            {guided && plan ? (
              <p className="text-white/60 text-xs truncate">
                Week {plannedForActive?.plannedWeek ?? plan.currentWeek}
                {plannedForActive ? ` · ${DAY_NAME[plannedForActive.plannedDay]}'s lesson` : ""}
              </p>
            ) : activeLesson && (
              <p className="text-white/40 text-xs truncate">{activeLesson.title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {guided && plan?.status && (
            <span className={cn("hidden sm:inline-flex rounded-full px-3 py-1 text-[13px] font-semibold", STATUS_CHIP[plan.status])}>{statusLabel(plan.status, plan.daysAhead, plan.daysBehind)}</span>
          )}
          <div className={cn("hidden items-center gap-2 w-40", guided ? "lg:flex" : "sm:flex")}>
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
          {!selectedQuiz && (activeLesson?.videoUrl || activeLesson?.type !== "text") && <div className="bg-black aspect-video w-full max-h-[calc(100vh-200px)] flex items-center justify-center">
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
                <LessonVideoPlayer
                  ref={playerRef}
                  lessonId={activeLesson.id}
                  src={playableVideoUrl(activeLesson.videoUrl)}
                  title={activeLesson.title}
                  captionsSrc={activeLesson.hasCaptions ? `/api/media/lesson/${activeLesson.id}/captions/en.vtt` : undefined}
                  onTimeUpdate={trackVideoTime}
                  onSeeking={() => { lastVideoTime.current = null; }}
                  onPosition={setPosition}
                  onEnded={() => { if (knowledgeCheck) setCheckForLesson(activeLesson.id); }}
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
          </div>}

          {/* Knowledge check: slides up when the video ends. */}
          {!selectedQuiz && knowledgeCheck && checkForLesson === activeLesson?.id && (
            <div className="bg-neutral-50 px-4 py-4 sm:px-6">
              <QuizRunner
                key={knowledgeCheck.id}
                quizId={knowledgeCheck.id}
                variant="compact"
                onClose={() => setCheckForLesson(null)}
                onReviewLesson={reviewLesson}
              />
            </div>
          )}

          {/* Lesson Controls */}
          {!selectedQuiz && <div className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between gap-4">
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
          </div>}

          {/* Lesson Content */}
          {!selectedQuiz && activeLesson && (
            <div className="bg-white px-6 py-6 flex-1 overflow-auto">
              <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">{activeLesson.title}</h2>
              {activeLesson.hasCaptions && (
                <div role="tablist" aria-label="Lesson content" className="mb-4 flex gap-1 border-b border-neutral-200">
                  {(["notes", "transcript"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      id={`lesson-tab-${tab}`}
                      aria-selected={contentTab === tab}
                      aria-controls={`lesson-panel-${tab}`}
                      onClick={() => setContentTab(tab)}
                      className={cn("-mb-px min-h-11 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800", contentTab === tab ? "border-accent-600 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-800")}
                    >
                      {tab === "notes" ? "Notes" : "Transcript"}
                    </button>
                  ))}
                </div>
              )}
              {activeLesson.hasCaptions && contentTab === "transcript" ? (
                <div role="tabpanel" id="lesson-panel-transcript" aria-labelledby="lesson-tab-transcript">
                  <TranscriptPanel lessonId={activeLesson.id} position={position} onSeek={(seconds) => playerRef.current?.seek(seconds)} />
                </div>
              ) : <div role={activeLesson.hasCaptions ? "tabpanel" : undefined} id={activeLesson.hasCaptions ? "lesson-panel-notes" : undefined} aria-labelledby={activeLesson.hasCaptions ? "lesson-tab-notes" : undefined}>
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
              </div>}
            </div>
          )}

          {selectedQuiz && (
            <section className="bg-white flex-1 px-4 py-6 sm:px-8" aria-label={selectedQuiz.title}>
              <div className="max-w-3xl mx-auto">
                <button type="button" onClick={() => setActiveQuiz(null)} className="text-sm font-medium text-primary-800 hover:underline mb-4">
                  Back to lessons
                </button>
                <QuizRunner
                  key={selectedQuiz.id}
                  quizId={selectedQuiz.id}
                  onClose={() => { setActiveQuiz(null); void refreshAssessments(); }}
                  onFinished={async (result) => {
                    await refreshAssessments();
                    if (result.passed) {
                      await refreshEnrollments();
                      const message = await planProgressMessage({ type: "chapter_quiz", id: selectedQuiz.id });
                      if (message) addToast({ type: "success", title: "Quiz passed", message });
                    }
                  }}
                  onReviewLesson={reviewLesson}
                />
              </div>
            </section>
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
                {guided && plan && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Week {plan.currentWeek} of {plan.weeks} ·{" "}
                    <Link href={`/dashboard/courses/${encodeURIComponent(slug)}/plan`} className="font-medium text-primary-800 hover:underline">
                      See this week
                    </Link>
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {guided && plan ? (
                  <DayCurriculum
                    plan={plan}
                    activeLessonId={activeLesson?.id}
                    activeQuizId={activeQuiz}
                    isDone={planItemDone}
                    onLesson={(lessonId) => {
                      const lesson = allLessons.find((item: CourseLesson) => item.id === lessonId);
                      if (lesson) handleLessonClick(lesson);
                    }}
                    onQuiz={(quizId) => {
                      setCheckForLesson(null);
                      setActiveQuiz(quizId);
                    }}
                  />
                ) : (
                <CurriculumAccordion
                  sections={curriculum.map((section) => ({
                    ...section,
                    lessons: section.lessons.map((lesson) => ({
                      ...lesson,
                      isCompleted: lesson.isCompleted || completedLessons.has(lesson.id),
                    })),
                  }))}
                  activeLesson={activeLesson?.id}
                  onLessonClick={handleLessonClick}
                />
                )}
                {!guided && chapterQuizzes.length > 0 && (
                  <section className="border-t border-neutral-100 p-4" aria-label="Chapter quizzes">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-2">Chapter quizzes</h3>
                    <ul className="space-y-1">
                      {orderedChapterQuizzes(curriculum, chapterQuizzes).map((quiz) => (
                        <li key={quiz.id}>
                          <button
                            type="button"
                            onClick={() => setActiveQuiz(quiz.id)}
                            className={cn("w-full text-left rounded-lg px-3 py-2 text-sm transition-colors", activeQuiz === quiz.id ? "bg-primary-50 text-primary-800 font-semibold" : "text-neutral-700 hover:bg-neutral-50")}
                          >
                            <span className="flex items-center gap-2">
                              <span aria-hidden="true" className={quiz.passed ? "text-success-dark" : "text-neutral-300"}>{quiz.passed ? "✓" : "○"}</span>
                              <span className="truncate">{quiz.title.replace(/^Chapter quiz:\s*/, "")}</span>
                            </span>
                            <span className="block pl-5 text-xs text-neutral-500">{quizStatus(quiz)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {finalExam && (
                  <section className="border-t border-neutral-100 p-4" aria-label="Final exam">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">Final exam</h3>
                    <p className="text-xs text-neutral-500 mb-2">{examStatus(finalExam)}</p>
                    {finalExam.locked !== "finish_programme" && (
                      <Link
                        href={finalExam.locked === "buy_certificate" ? `/checkout?certificate=${encodeURIComponent(slug)}` : finalExam.locked === "passed" ? "/dashboard/certificates" : `/dashboard/courses/${encodeURIComponent(slug)}/exam`}
                        className="inline-flex min-h-10 items-center rounded-lg bg-accent-700 px-3 text-sm font-semibold text-white hover:bg-accent-800"
                      >
                        {finalExam.locked === "buy_certificate" ? "Get my certificate" : finalExam.locked === "passed" ? "See my certificate" : "Take your final exam"}
                      </Link>
                    )}
                  </section>
                )}
                {quizzesLoadError && (
                  <p role="alert" className="border-t border-neutral-100 p-4 text-xs text-error">
                    Could not load your quizzes. Refresh the page to try again.
                  </p>
                )}
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

function orderedChapterQuizzes(curriculum: Array<{ id: number }>, quizzes: AssessmentQuiz[]): AssessmentQuiz[] {
  const order = new Map(curriculum.map((section, index) => [section.id, index]));
  return [...quizzes].sort((a, b) => (order.get(a.sectionId ?? -1) ?? 999) - (order.get(b.sectionId ?? -1) ?? 999));
}

function quizStatus(quiz: AssessmentQuiz): string {
  if (quiz.passed) return `Passed${quiz.bestScore !== null ? ` · best ${quiz.bestScore}%` : ""}`;
  if (quiz.nextAttemptAt) return `Next try ${lagosTime(quiz.nextAttemptAt)}`;
  if (quiz.attempts) return `Best ${quiz.bestScore ?? 0}% · pass mark ${quiz.passingScore}%`;
  return `Pass mark ${quiz.passingScore}%`;
}

function examStatus(exam: AssessmentQuiz): string {
  if (exam.locked === "finish_programme") return "Opens when you finish every lesson and chapter quiz.";
  if (exam.locked === "buy_certificate") return `Get your certificate: pay ${naira(site.programme.certificatePrice)}, then take your final exam.`;
  if (exam.locked === "passed") return "Passed. Your certificate is ready.";
  return "Your certificate is paid for. Pass the exam to receive it.";
}
