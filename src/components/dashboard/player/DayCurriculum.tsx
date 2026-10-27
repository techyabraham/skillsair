"use client";

import { cn } from "@/lib/utils";
import { DAY_NAME, DAY_SHORT } from "@/lib/plan-client";
import type { CoursePlan, PlanDay, PlanItem } from "@/types/plan";

interface DayCurriculumProps {
  plan: CoursePlan;
  activeLessonId?: number;
  activeQuizId?: number | null;
  onLesson: (lessonId: number) => void;
  onQuiz: (quizId: number) => void;
  /** The plan's done flags, plus what the player knows already (a lesson just completed). */
  isDone: (item: PlanItem) => boolean;
}

/**
 * The player sidebar for guided learners: this week only, by day. Steps still waiting from
 * earlier days come first under Catch up; finished days fold into one line. Every lesson and quiz
 * stays open whatever its day: this is a guide, never a lock.
 */
export function DayCurriculum({ plan, activeLessonId, activeQuizId, onLesson, onQuiz, isDone }: DayCurriculumProps) {
  const week = plan.week;
  const lessonsOf = (day: PlanDay) => day.items.filter((item) => item.type !== "final_exam");
  const all = week.days.flatMap(lessonsOf);
  const doneCount = all.filter(isDone).length;
  const finished = week.days.filter((day) => lessonsOf(day).length > 0 && lessonsOf(day).every(isDone));
  const open = week.days.filter((day) => lessonsOf(day).length > 0 && !lessonsOf(day).every(isDone));
  const earlyDays = finished.filter((day) => day.state === "done_early" || day.state === "upcoming");
  const catchUp = (plan.overdue ?? []).filter((item) => item.plannedWeek < week.week && !isDone(item));
  const lastDay = [...week.days].reverse().find((day) => lessonsOf(day).length > 0);
  const finishedLessons = finished.reduce((sum, day) => sum + lessonsOf(day).length, 0);

  const row = (item: PlanItem, overdue = false) => {
    const active = item.type === "lesson" ? item.id === activeLessonId && !activeQuizId : item.id === activeQuizId;
    const done = isDone(item);
    return (
      <li key={`${item.type}-${item.id}`}>
        <button
          type="button"
          aria-current={active ? "true" : undefined}
          onClick={() => (item.type === "lesson" ? onLesson(item.id) : item.type === "chapter_quiz" ? onQuiz(item.id) : undefined)}
          className={cn(
            "flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
            active ? "border-[1.5px] border-navy bg-white font-semibold text-navy" : "text-neutral-900 hover:bg-white",
          )}
        >
          {active ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#0d1b4b"><path d="M8 5v14l11-7z" /></svg>
          ) : done ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
          ) : (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>
          )}
          <span className={cn("min-w-0 flex-1 truncate", done && !active && "text-neutral-500")}>
            {item.type === "chapter_quiz" ? item.title.replace(/^Chapter quiz:\s*/, "Quiz: ") : item.title}
            {done && <span className="sr-only"> (done)</span>}
          </span>
          {overdue && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="From an earlier day" aria-label="From an earlier day" />}
          <span className="shrink-0 text-[13px] font-normal text-neutral-500">{item.minutes} min</span>
        </button>
      </li>
    );
  };

  return (
    <div className="bg-neutral-50 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold text-navy">Week {week.week}</h2>
        <span className="text-sm text-neutral-600">{doneCount} of {all.length} done</span>
      </div>

      {catchUp.length > 0 && (
        <>
          <p className="mb-1.5 mt-5 text-[13px] font-semibold uppercase tracking-wide text-amber-900">Catch up</p>
          <ul>{catchUp.map((item) => row(item, true))}</ul>
        </>
      )}

      {finished.length > 0 && (
        <>
          <p className="mb-1 mt-5 text-[13px] font-semibold uppercase tracking-wide text-green-800">{finished.map((day) => DAY_SHORT[day.day]).join(" · ")} · done</p>
          <p className="text-sm text-neutral-500">
            {finishedLessons} lesson{finishedLessons === 1 ? "" : "s"}
            {earlyDays.length ? `, including ${earlyDays.map((day) => `${DAY_NAME[day.day]}'s`).join(" and ")} done early` : ""}.
          </p>
        </>
      )}

      {open.map((day) => (
        <div key={day.day}>
          <p className={cn("mb-1.5 mt-5 text-[13px] font-semibold uppercase tracking-wide", day.state === "today" ? "text-navy" : day.state === "missed" ? "text-amber-900" : "text-neutral-600")}>
            {DAY_NAME[day.day]}
            {day.state === "today" ? " · today" : ""}
          </p>
          <ul>{lessonsOf(day).map((item) => row(item, day.state === "missed"))}</ul>
        </div>
      ))}

      {lastDay && week.week < plan.weeks && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-3.5">
          <p className="text-sm text-neutral-600">Finish {DAY_NAME[lastDay.day]}&apos;s lessons and week {week.week + 1} opens straight away.</p>
        </div>
      )}
    </div>
  );
}
