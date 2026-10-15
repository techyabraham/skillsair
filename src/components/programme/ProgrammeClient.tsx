"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { track } from "@/lib/analytics";
import type { CourseLesson, CourseSection, EnrolledCourse } from "@/types/course";

const OPEN_PREVIEW_EVENT = "sa-open-preview";

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  });

/** Enrolled learners see "Continue learning" instead of the apply CTA. */
export function ProgrammeActions({ slug, courseId, applyLabel }: { slug: string; courseId: number; applyLabel: string }) {
  const { isAuthenticated, user } = useAuth();
  const { data: enrollments = [] } = useSWR<EnrolledCourse[]>(isAuthenticated && user ? `/api/students/${user.id}/courses` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const enrolled = enrollments.some((item) => item.id === courseId || item.slug === slug);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {enrolled ? (
        <Link href={`/dashboard/courses/${slug}/learn`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-6 py-3 font-semibold text-white hover:bg-accent-800">
          Continue learning →
        </Link>
      ) : (
        <Link href={`/apply?programme=${encodeURIComponent(slug)}`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-6 py-3 font-semibold text-white hover:bg-accent-800">
          {applyLabel}
        </Link>
      )}
    </div>
  );
}

export function WatchPreviewButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREVIEW_EVENT))}
      className={className ?? "flex min-h-12 items-center justify-center rounded-xl border-2 border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"}
    >
      ▶ Watch a free lesson
    </button>
  );
}

/** Curriculum with playable free-preview lessons. Paid lessons stay locked by the backend. */
export function PreviewCurriculum({ sections, slug }: { sections: CourseSection[]; slug: string }) {
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => {
      const first = sections.flatMap((section) => section.lessons).find((item) => item.isPreview);
      if (first) setLesson(first);
      else document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener(OPEN_PREVIEW_EVENT, open);
    return () => window.removeEventListener(OPEN_PREVIEW_EVENT, open);
  }, [sections]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lesson && !dialog.open) {
      dialog.showModal();
      track("preview_lesson_play", { programme: slug, lesson: lesson.id });
    }
    if (!lesson && dialog.open) dialog.close();
  }, [lesson, slug]);

  if (!sections.length) {
    return <p className="text-neutral-600">The full curriculum is being finalised. Message us on WhatsApp for the outline.</p>;
  }

  return (
    <>
      <CurriculumAccordion sections={sections} showPreviewOnly onLessonClick={(item) => item.isPreview && setLesson(item)} />
      <dialog
        ref={dialogRef}
        onClose={() => setLesson(null)}
        className="w-[min(56rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-neutral-900/70"
        aria-label={lesson ? `Free lesson: ${lesson.title}` : "Free lesson"}
      >
        {lesson && (
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 p-4">
              <h3 className="font-heading font-semibold text-neutral-900">{lesson.title}</h3>
              <button type="button" onClick={() => setLesson(null)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-neutral-100" aria-label="Close lesson">
                ✕
              </button>
            </div>
            {lesson.videoUrl ? (
              <video className="aspect-video w-full bg-black" src={lesson.videoUrl} controls preload="none" playsInline />
            ) : lesson.content ? (
              // Content is escaped by the course mapper before it is wrapped in paragraphs.
              <div className="prose-legal max-h-[70vh] overflow-y-auto p-6" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p className="p-6 text-neutral-600">This preview is being prepared.</p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
