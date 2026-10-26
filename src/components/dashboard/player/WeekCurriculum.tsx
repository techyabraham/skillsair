"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CoursePlan, PlanItem } from "@/types/plan";

interface WeekCurriculumProps {
  plan: CoursePlan;
  activeLessonId?: number;
  activeQuizId?: number | null;
  onLesson: (lessonId: number) => void;
  onQuiz: (quizId: number) => void;
  /** Overrides the plan's done flags with what the player knows already (just-completed lessons). */
  isDone: (item: PlanItem) => boolean;
}

/**
 * The player sidebar "By week": the guided plan's weeks, the current one open. Every lesson and
 * quiz stays open to the learner whatever its week: this is a guide, never a lock.
 */
export function WeekCurriculum({ plan, activeLessonId, activeQuizId, onLesson, onQuiz, isDone }: WeekCurriculumProps) {
  const [open, setOpen] = useState<Set<number>>(new Set([plan.currentWeek]));
  const toggle = (week: number) => setOpen((current) => {
    const next = new Set(current);
    if (next.has(week)) next.delete(week);
    else next.add(week);
    return next;
  });

  return (
    <div className="divide-y divide-neutral-100">
      {plan.plan.map((week) => {
        const items = week.items.filter((item) => item.type !== "final_exam");
        const done = items.filter(isDone).length;
        const current = week.week === plan.currentWeek;
        const overdue = plan.pace === "guided" && week.week < plan.currentWeek && done < items.length;
        const isOpen = open.has(week.week);
        return (
          <div key={week.week}>
            <button
              type="button"
              onClick={() => toggle(week.week)}
              aria-expanded={isOpen}
              className="flex min-h-11 w-full items-center justify-between gap-2 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-800"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  Week {week.week}
                  {current && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-800">This week</span>}
                  {overdue && <span className="h-2 w-2 rounded-full bg-warning" aria-label="Steps to catch up" title="Steps to catch up" />}
                </span>
                <span className="block text-xs text-neutral-600">{done} of {items.length} done · {week.minutes} min</span>
              </span>
              <svg className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <ul className="divide-y divide-neutral-100">
                {items.length === 0 && <li className="px-4 py-3 text-xs text-neutral-500">A free week to catch up or review.</li>}
                {items.map((item) => {
                  const active = item.type === "lesson" ? item.id === activeLessonId && !activeQuizId : item.id === activeQuizId;
                  const itemDone = isDone(item);
                  return (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => (item.type === "lesson" ? onLesson(item.id) : onQuiz(item.id))}
                        className={cn("flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-800", active ? "bg-primary-50" : "hover:bg-neutral-50")}
                      >
                        <span aria-hidden="true" className={itemDone ? "text-success-dark" : "text-neutral-300"}>{itemDone ? "✓" : "○"}</span>
                        <span className={cn("min-w-0 flex-1 truncate text-sm", active ? "font-semibold text-primary-800" : "text-neutral-700")}>
                          {item.type === "chapter_quiz" ? item.title.replace(/^Chapter quiz:\s*/, "Quiz: ") : item.title}
                        </span>
                        {overdue && !itemDone && <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-label="From an earlier week" title="From an earlier week" />}
                        <span className="shrink-0 text-xs text-neutral-500">{item.minutes} min</span>
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
  );
}
