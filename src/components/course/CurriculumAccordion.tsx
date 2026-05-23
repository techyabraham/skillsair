"use client";

import React, { useState } from "react";
import { cn, formatDuration } from "@/lib/utils";
import type { CourseSection, CourseLesson } from "@/types/course";

const lessonTypeIcons: Record<string, React.ReactNode> = {
  video: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  text: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  quiz: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  assignment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
};

interface CurriculumAccordionProps {
  sections: CourseSection[];
  activeLesson?: number;
  onLessonClick?: (lesson: CourseLesson, sectionId: number) => void;
  showPreviewOnly?: boolean;
}

export function CurriculumAccordion({
  sections,
  activeLesson,
  onLessonClick,
  showPreviewOnly = false,
}: CurriculumAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(
    new Set([sections[0]?.id])
  );

  const toggleSection = (sectionId: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalDuration = sections.reduce((acc, s) => acc + s.totalDuration, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">
          {sections.length} sections • {totalLessons} lessons • {formatDuration(totalDuration)} total
        </p>
        <button
          onClick={() => {
            const allOpen = sections.every((s) => openSections.has(s.id));
            if (allOpen) {
              setOpenSections(new Set());
            } else {
              setOpenSections(new Set(sections.map((s) => s.id)));
            }
          }}
          className="text-xs font-medium text-primary-800 hover:underline"
        >
          {sections.every((s) => openSections.has(s.id)) ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <p className="font-semibold text-sm text-neutral-900">{section.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {section.lessons.length} lessons • {formatDuration(section.totalDuration)}
                  </p>
                </div>
                <svg
                  className={cn("w-5 h-5 text-neutral-400 transition-transform shrink-0 ml-3", isOpen && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <ul className="divide-y divide-neutral-100">
                  {section.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLesson;
                    const isClickable = lesson.isPreview || !showPreviewOnly || !!onLessonClick;

                    return (
                      <li key={lesson.id}>
                        <button
                          disabled={!isClickable}
                          onClick={() => isClickable && onLessonClick?.(lesson, section.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
                            isActive ? "bg-primary-50" : "hover:bg-neutral-50",
                            !isClickable && "cursor-default"
                          )}
                        >
                          <span
                            className={cn(
                              "shrink-0",
                              isActive ? "text-primary-800" : "text-neutral-400"
                            )}
                          >
                            {lesson.isCompleted ? (
                              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              lessonTypeIcons[lesson.type] || lessonTypeIcons.video
                            )}
                          </span>
                          <span className={cn("flex-1 text-sm truncate", isActive ? "font-semibold text-primary-800" : "text-neutral-700")}>
                            {lesson.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {lesson.isPreview && (
                              <span className="text-xs font-medium text-success-dark bg-success-light px-2 py-0.5 rounded-full">
                                Preview
                              </span>
                            )}
                            {lesson.duration > 0 && (
                              <span className="text-xs text-neutral-400">{formatDuration(lesson.duration)}</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
