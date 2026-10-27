"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useCourse } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/Skeleton";
import { guidedPlanOn } from "@/content/site";
import { track } from "@/lib/analytics";
import { DAY_NAME, lagosDay, planApi, planDate, planKeys, PlanError, STATUS_CHIP, statusLabel, timeLeft, weekRange } from "@/lib/plan-client";
import { cn } from "@/lib/utils";
import type { CoursePlan, DayState, PlanDay, PlanItem } from "@/types/plan";

/**
 * /dashboard/courses/[slug]/plan: this week of the learner's guided plan, Monday to Friday. One
 * week at a time (?week=N for the arrows), never every week's lessons. Chapter view is a quiet
 * option at the very bottom, behind a confirmation; it is never the default or the emphasis.
 */
export function PlanPage({ slug }: { slug: string }) {
  const params = useSearchParams();
  const requested = Number(params.get("week"));
  const weekParam = Number.isInteger(requested) && requested > 0 ? requested : undefined;
  const { course, isLoading: courseLoading } = useCourse(slug);
  const { data: plan, error, isLoading, mutate } = useSWR(guidedPlanOn && course?.id ? planKeys.course(course.id, weekParam) : null, () => planApi.course(course!.id, weekParam), { revalidateOnFocus: false, keepPreviousData: true });
  const viewed = useRef(false);

  useEffect(() => {
    if (plan && !viewed.current) {
      viewed.current = true;
      track("plan_viewed", { course: slug, pace: plan.pace });
    }
  }, [plan, slug]);

  const learnHref = `/dashboard/courses/${encodeURIComponent(slug)}/learn`;
  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center px-4 sm:px-6">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-accent-700 hover:text-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">← {guidedPlanOn ? "Today" : "Dashboard"}</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-6">{children}</div>
    </div>
  );

  if (!guidedPlanOn || (error instanceof PlanError && error.code === "FEATURE_DISABLED")) {
    return shell(<p className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">Your lessons are all in the programme. <Link href={learnHref} className="font-semibold text-accent-700 hover:underline">Go to your lessons</Link>.</p>);
  }
  if (courseLoading || (isLoading && !plan) || (course && !plan && !error)) {
    return shell(
      <div aria-busy="true" aria-label="Loading your plan" className="space-y-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" rounded />
        <div className="grid gap-3.5 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40" rounded />)}</div>
      </div>,
    );
  }
  if (error || !plan) {
    const noPlan = error instanceof PlanError && error.status === 404;
    return shell(<p role="status" className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">{noPlan ? "This course doesn't have a weekly plan. Take the lessons in the order shown." : "We couldn't load your plan. Refresh to try again."}</p>);
  }
  const onChanged = (next: CoursePlan) => void mutate(next, { revalidate: false });
  if (plan.pace === "chapters") return shell(<ChapterView plan={plan} learnHref={learnHref} onChanged={onChanged} />);
  return shell(<WeekPlan plan={plan} onChanged={onChanged} />);
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function WeekPlan({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const week = plan.week;
  const lessons = week.days.flatMap((day) => day.items).filter((item) => item.type !== "final_exam");
  const behind = plan.status === "behind" || plan.status === "overrun";
  const weekHref = (n: number) => `?week=${n}`;

  useEffect(() => {
    // plan_week_completed: once, when the UI first sees a week turn complete.
    if (week.totalCount > 0 && week.doneCount === week.totalCount && onceKey(`sa_plan_week_done:${plan.courseId}:${week.week}`)) track("plan_week_completed", { week: week.week, course: plan.slug });
  }, [plan.courseId, plan.slug, week.week, week.doneCount, week.totalCount]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">{plan.title}</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-navy sm:text-[34px]">Week {week.week}{week.title ? `: ${week.title}` : ""}</h1>
          <p className="mt-1.5 text-base text-neutral-600">{weekRange(week.startsOn, week.endsOn)} · {plural(lessons.length, "lesson")} · {timeLeft(week.minutes)}</p>
        </div>
        <nav aria-label="Weeks" className="flex gap-2">
          {week.week > 1 && <Link href={weekHref(week.week - 1)} className={WEEK_BUTTON}>‹ Week {week.week - 1}</Link>}
          {week.week < plan.weeks && <Link href={weekHref(week.week + 1)} className={WEEK_BUTTON}>Week {week.week + 1} ›</Link>}
        </nav>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5 rounded-2xl border border-neutral-200 bg-white px-5 py-4">
        {plan.status && <span className={cn("rounded-full px-3.5 py-1.5 text-[15px] font-semibold", STATUS_CHIP[plan.status])}>{statusLabel(plan.status, plan.daysAhead, plan.daysBehind)}</span>}
        <div className="min-w-0 flex-[1_1_320px]">
          <div className="flex justify-between gap-3 text-sm text-neutral-600">
            <span>Your {plan.weeks} weeks</span>
            <span>Week {plan.currentWeek} · finish by {planDate(plan.finishBy)}</span>
          </div>
          <WeeksBar plan={plan} />
        </div>
      </div>

      {behind && <CatchUp plan={plan} onChanged={onChanged} />}

      <div className="mt-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        {week.days.map((day) => <DayCard key={day.day} day={day} plan={plan} />)}
      </div>

      <p className="mt-4 text-[15px] text-neutral-600">
        Saturday and Sunday are free for catching up or practising.{week.week < plan.weeks ? ` Finish the week early and week ${week.week + 1} opens straight away.` : ""}
      </p>

      <LearningMode plan={plan} onChanged={onChanged} />
    </>
  );
}

const WEEK_BUTTON = "inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-neutral-300 bg-white px-3.5 font-semibold text-navy hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy";

const onceKey = (key: string) => {
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
};

const SEGMENT: Record<CoursePlan["weeksSummary"][number]["state"], string> = { done: "bg-green-700", current: "bg-navy", upcoming: "bg-neutral-200", behind: "bg-amber-500" };

/** The 12 weeks as segments (no lesson titles). */
function WeeksBar({ plan }: { plan: CoursePlan }) {
  const done = plan.weeksSummary.filter((week) => week.state === "done").length;
  const behind = plan.weeksSummary.filter((week) => week.state === "behind").length;
  const label = `${done} of ${plan.weeks} weeks done${behind ? `, ${behind} with lessons to catch up` : ""}, week ${plan.currentWeek} in progress`;
  return (
    <div role="img" aria-label={label} className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${plan.weeks}, minmax(0, 1fr))` }}>
      {plan.weeksSummary.map((week) => <span key={week.week} className={cn("h-2 rounded", SEGMENT[week.state])} />)}
    </div>
  );
}

function CatchUp({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const first = plan.overdue?.[0];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-[15px] text-neutral-800">
      <p className="w-full">Life happens. Catch up this week or move your plan so it fits.</p>
      {first && <Link href={first.href} onClick={() => track("plan_continue_clicked", { course: plan.slug, from: "plan" })} className={PRIMARY}>Catch up now</Link>}
      {plan.canReset ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              const next = await planApi.reset(plan.courseId);
              track("plan_reset", { course: plan.slug, from: "plan" });
              onChanged(next);
              setMessage("Done. Your plan now starts from where you are.");
            } catch (err) {
              const retryAt = err instanceof PlanError ? err.fields?.retryAt : undefined;
              setMessage(retryAt ? `You can move your plan again on ${lagosDay(retryAt)}.` : err instanceof Error ? err.message : "That didn't work. Try again.");
            } finally {
              setBusy(false);
            }
          }}
          className={SECONDARY}
        >
          {busy ? "Moving…" : "Move my plan"}
        </button>
      ) : plan.resetAvailableAt ? (
        <p className="text-neutral-600">You can move your plan again on {lagosDay(plan.resetAvailableAt)}.</p>
      ) : null}
      {message && <p role="status" aria-live="polite" className="w-full text-neutral-700">{message}</p>}
    </div>
  );
}

const PRIMARY = "inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-5 font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";
const SECONDARY = "inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-neutral-300 bg-white px-4 font-semibold text-navy hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60";

const CARD_BORDER: Record<DayState, string> = {
  today: "border-2 border-navy p-[15px]",
  done: "border border-neutral-200 p-4",
  done_early: "border border-blue-200 p-4",
  missed: "border border-amber-300 p-4",
  upcoming: "border border-neutral-200 p-4",
  free: "border border-neutral-200 p-4",
};

function DayLabel({ day }: { day: PlanDay }) {
  const allDone = day.totalCount > 0 && day.doneCount === day.totalCount;
  if (day.state === "today") return <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-white">Today</span>;
  if (day.state === "done") return <span className="text-[13px] font-semibold text-green-800">Done</span>;
  if (day.state === "done_early") return <span className="text-[13px] font-semibold text-blue-900">Done early</span>;
  if (day.state === "missed") return <span className="text-[13px] font-semibold text-amber-900">Missed</span>;
  if (!day.totalCount || allDone) return null;
  return <span className="text-[13px] text-neutral-500">{day.minutes} min</span>;
}

function DayCard({ day, plan }: { day: PlanDay; plan: CoursePlan }) {
  const lessons = day.items.filter((item) => item.type !== "final_exam");
  const allDone = lessons.length > 0 && lessons.every((item) => item.done);
  return (
    <section aria-label={`${DAY_NAME[day.day]}${day.state === "today" ? ", today" : ""}`} className={cn("flex flex-col gap-2.5 rounded-2xl bg-white", CARD_BORDER[day.state])}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-navy">{DAY_NAME[day.day]}</h2>
        <DayLabel day={day} />
      </div>
      {day.items.length === 0 && <p className="text-sm text-neutral-500">No new lesson: practise or catch up</p>}
      {day.items.map((item) => <PlanItemLink key={`${item.type}-${item.id}`} item={item} plan={plan} />)}
      {day.state === "today" && allDone && <p className="text-[13px] font-semibold text-green-800">Done</p>}
    </section>
  );
}

function PlanItemLink({ item, plan }: { item: PlanItem; plan: CoursePlan }) {
  const next = plan.nextItem && plan.nextItem.type === item.type && plan.nextItem.id === item.id;
  const early = next && isLater(item, plan);
  const label = item.type === "final_exam" ? `${item.title}: opens once every lesson and chapter quiz is done` : item.title;
  return (
    <Link
      href={item.href}
      onClick={() => track("plan_continue_clicked", { course: plan.slug, from: "plan" })}
      className={cn(
        "block min-h-11 rounded-[10px] px-3 py-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
        next ? "border-[1.5px] border-accent-700 bg-accent-50 font-semibold text-neutral-900" : item.done ? "bg-neutral-50 text-neutral-500" : "bg-neutral-50 text-neutral-900 hover:bg-neutral-100",
      )}
    >
      <span className={cn(item.done && "line-through")}>{label}</span>
      {item.done && <span className="sr-only"> (done)</span>}
      <br />
      {next ? (
        <span className="text-[13px] font-semibold text-accent-700">Up next{early ? " · start early" : ""}</span>
      ) : item.minutes ? (
        <span className="text-[13px] font-normal text-neutral-500">{item.minutes} min</span>
      ) : null}
    </Link>
  );
}

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri"];
/** Planned for a later day than today (so doing it now is starting early). */
function isLater(item: PlanItem, plan: CoursePlan): boolean {
  if (item.plannedWeek !== plan.currentWeek) return item.plannedWeek > plan.currentWeek;
  if (plan.today === "weekend") return false;
  return DAY_ORDER.indexOf(item.plannedDay) > DAY_ORDER.indexOf(plan.today);
}

function LearningMode({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <section aria-labelledby="learning-mode" className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
      <div>
        <h2 id="learning-mode" className="text-[15px] font-semibold text-neutral-700">Learning mode: guided {plan.weeks}-week plan</h2>
        <p className="mt-1 text-sm text-neutral-500">Prefer to see the whole course by chapter with no daily plan?</p>
      </div>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg px-1 text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
        Switch to chapter view
      </button>
      {message && <p role="status" aria-live="polite" className="w-full text-sm text-neutral-600">{message}</p>}
      {open && (
        <ChapterViewConfirm
          busy={busy}
          onKeep={() => {
            track("plan_chapter_view_cancelled", { course: plan.slug });
            close();
          }}
          onSwitch={async () => {
            setBusy(true);
            try {
              const next = await planApi.setPace(plan.courseId, "chapters");
              track("plan_pace_changed", { to: "chapters", course: plan.slug });
              setOpen(false);
              onChanged(next);
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "That didn't save. Try again.");
              close();
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}

/** "Are you sure you want to leave your plan?": a bottom sheet on phones, a dialog on larger screens. */
function ChapterViewConfirm({ busy, onKeep, onSwitch }: { busy: boolean; onKeep: () => void; onSwitch: () => void }) {
  const keep = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    keep.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onKeep();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>("button:not([disabled])");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKeep]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/55" onClick={onKeep} />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="leave-plan-title" className="relative flex w-full flex-col gap-3 rounded-t-[20px] bg-white px-5 pb-7 pt-5 sm:max-w-[440px] sm:rounded-[20px] sm:p-7">
        <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-neutral-300 sm:hidden" />
        <h2 id="leave-plan-title" className="mt-1 text-[21px] font-bold text-navy">Are you sure you want to leave your plan?</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">Your plan is what gets people to the finish line. A little each weekday keeps the skill fresh, and you always know what to do next.</p>
        <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-neutral-700">
          <li>Chapter view shows the whole course at once, with no daily lessons.</li>
          <li>Your weekly plan and Monday reminders stop.</li>
          <li>You can come back to the plan at any time.</li>
        </ul>
        <button ref={keep} type="button" onClick={onKeep} className="mt-1 min-h-[52px] rounded-xl bg-accent-700 text-base font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
          Keep my plan
        </button>
        <button type="button" onClick={onSwitch} disabled={busy} className="min-h-[52px] rounded-xl border-[1.5px] border-neutral-300 bg-white text-base font-medium text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60">
          {busy ? "Switching…" : "Yes, switch to chapter view"}
        </button>
      </div>
    </div>
  );
}

/** Chapter view: no plan surfaces, just the way back (no confirmation needed). */
function ChapterView({ plan, learnHref, onChanged }: { plan: CoursePlan; learnHref: string; onChanged: (plan: CoursePlan) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">{plan.title}</p>
      <h1 className="mt-1 text-[28px] font-bold leading-tight text-navy">Chapter view</h1>
      <p className="mt-2 text-neutral-700">You see the whole course by chapter, with no daily plan or Monday reminders.</p>
      <Link href={plan.nextItem?.href ?? learnHref} className={cn(PRIMARY, "mt-5")}>{plan.nextItem ? `Continue: ${plan.nextItem.title}` : "Go to your lessons"}</Link>
      <section aria-labelledby="learning-mode" className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
        <h2 id="learning-mode" className="text-[15px] font-semibold text-neutral-700">Learning mode: chapter view</h2>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              const next = await planApi.setPace(plan.courseId, "guided");
              track("plan_pace_changed", { to: "guided", course: plan.slug });
              onChanged(next);
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "That didn't save. Try again.");
            } finally {
              setBusy(false);
            }
          }}
          className="min-h-11 rounded-lg px-1 text-sm font-semibold text-accent-700 underline underline-offset-2 hover:text-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60"
        >
          {busy ? "Switching…" : "Go back to my guided plan"}
        </button>
        {message && <p role="status" aria-live="polite" className="w-full text-sm text-neutral-600">{message}</p>}
      </section>
    </>
  );
}
