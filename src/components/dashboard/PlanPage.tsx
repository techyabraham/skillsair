"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useCourse } from "@/hooks/useCourses";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { guidedPlanOn, site } from "@/content/site";
import { track } from "@/lib/analytics";
import { lagosDay, planApi, planDate, planKeys, PlanError, STATUS_CHIP, statusLabel, timeLeft } from "@/lib/plan-client";
import { cn } from "@/lib/utils";
import type { CoursePlan, PlanItem, PlanPace, PlanWeek } from "@/types/plan";

/**
 * /dashboard/courses/[slug]/plan: the learner's guided 12-week plan. Weeks as an accordion (the
 * current week open), each step links into the player. Plan settings (guided or self-paced) sit
 * at the bottom, low-key: the guided plan is the default and the recommended choice.
 */
export function PlanPage({ slug }: { slug: string }) {
  const { course, isLoading: courseLoading } = useCourse(slug);
  const { data: plan, error, isLoading, mutate } = useSWR(guidedPlanOn && course?.id ? planKeys.course(course.id) : null, () => planApi.course(course!.id), { revalidateOnFocus: false });
  const viewed = useRef(false);

  useEffect(() => {
    if (plan && !viewed.current) {
      viewed.current = true;
      track("plan_viewed", { course: slug, pace: plan.pace });
    }
  }, [plan, slug]);

  const learnHref = `/dashboard/courses/${encodeURIComponent(slug)}/learn`;
  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Link href={learnHref} className="inline-flex min-h-11 items-center text-sm font-medium text-primary-800 hover:underline">
        ← Back to {course?.title ?? "the programme"}
      </Link>
      <div className="mt-2">{children}</div>
    </div>
  );

  if (!guidedPlanOn || (error instanceof PlanError && error.code === "FEATURE_DISABLED")) {
    return shell(<p className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">Your lessons are all in the programme. <Link href={learnHref} className="font-medium text-primary-800 hover:underline">Go to your lessons</Link>.</p>);
  }
  if (courseLoading || isLoading || (course && !plan && !error)) {
    return shell(
      <div aria-busy="true" aria-label="Loading your plan" className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" rounded />)}
      </div>,
    );
  }
  if (error || !plan) {
    const noPlan = error instanceof PlanError && error.status === 404;
    return shell(
      <p role="status" className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700">
        {noPlan ? "This course doesn't have a weekly plan. Take the lessons in the order shown." : "We couldn't load your plan. Refresh to try again."}
      </p>,
    );
  }
  return shell(<PlanBody plan={plan} onChanged={(next) => void mutate(next, { revalidate: false })} />);
}

function PlanBody({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const guided = plan.pace === "guided";
  const behind = plan.status === "behind" || plan.status === "overrun";
  const chip = plan.status ? STATUS_CHIP[plan.status] : null;
  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">{plan.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">{guided ? "Your weekly plan" : "Suggested weekly plan"}</h1>
          {chip && plan.status && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chip.className}`}>{statusLabel(plan.status, plan.weeksBehind)}</span>}
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-neutral-50 p-3">
            <dt className="text-neutral-500">Started</dt>
            <dd className="font-medium text-neutral-900">{planDate(plan.startedAt)}</dd>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <dt className="text-neutral-500">{guided ? "Finish by" : "Suggested finish"}</dt>
            <dd className="font-medium text-neutral-900">{planDate(plan.finishBy, true)}</dd>
          </div>
          {guided && behind && (
            <div className="rounded-xl bg-neutral-50 p-3">
              <dt className="text-neutral-500">At your recent pace</dt>
              <dd className="font-medium text-neutral-900">{plan.projectedFinish ? planDate(plan.projectedFinish, true) : "Do one step to see this"}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 text-sm text-neutral-600">
          Week {plan.currentWeek} of {plan.weeks}. {guided ? `About ${site.programme.weeklyHours} hours a week, with a reminder every Monday.` : "Self-paced: no weekly goals or reminders. The weeks below are a suggestion."}
        </p>
        {guided && behind && <MovePlan plan={plan} onChanged={onChanged} />}
      </header>

      <ol className="mt-6 space-y-2" aria-label="Weeks">
        {plan.plan.map((week) => (
          <WeekRow key={week.week} week={week} plan={plan} />
        ))}
      </ol>

      <PlanSettings plan={plan} onChanged={onChanged} />
    </>
  );
}

function MovePlan({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="mt-4 rounded-xl bg-warning-light/60 p-4 text-sm text-neutral-800">
      <p>Life happens. Catch up this week or move your plan so it fits.</p>
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
          className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-neutral-300 bg-white px-4 font-semibold hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 disabled:opacity-60"
        >
          {busy ? "Moving…" : "Move my plan"}
        </button>
      ) : plan.resetAvailableAt ? (
        <p className="mt-1 text-neutral-600">You can move your plan again on {lagosDay(plan.resetAvailableAt)}.</p>
      ) : null}
      {message && <p role="status" aria-live="polite" className="mt-2 text-neutral-700">{message}</p>}
    </div>
  );
}

function WeekRow({ week, plan }: { week: PlanWeek; plan: CoursePlan }) {
  const current = week.week === plan.currentWeek;
  const past = week.week < plan.currentWeek;
  const complete = week.totalCount > 0 && week.doneCount === week.totalCount;
  const overdue = plan.pace === "guided" && past && !complete;
  const [open, setOpen] = useState(current);
  const panelId = `plan-week-${week.week}`;
  return (
    <li className={cn("rounded-2xl border bg-white", current ? "border-primary-200 shadow-card" : "border-neutral-100")}>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-heading font-semibold text-neutral-900">
              Week {week.week}
              {current && <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800">This week</span>}
            </span>
            <span className="block text-xs text-neutral-500">
              {planDate(week.startsOn)} to {planDate(week.endsOn)} · {week.doneCount} of {week.totalCount} done · {timeLeft(week.minutes)}
            </span>
          </span>
          {complete ? (
            <span className="shrink-0 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success-dark">✓ Done</span>
          ) : overdue ? (
            <span className="shrink-0 rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-amber-900">{week.totalCount - week.doneCount} to catch up</span>
          ) : null}
          <svg className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h2>
      {open && (
        <ul id={panelId} className="border-t border-neutral-100 px-2 py-2">
          {week.items.length === 0 && <li className="px-2 py-2 text-sm text-neutral-500">A free week to catch up or review.</li>}
          {week.items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <ItemLink item={item} slug={plan.slug} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

const KIND_LABEL: Record<PlanItem["type"], string> = { lesson: "Lesson", chapter_quiz: "Chapter quiz", final_exam: "Final exam" };

function ItemLink({ item, slug }: { item: PlanItem; slug: string }) {
  return (
    <Link
      href={item.href}
      onClick={() => track("plan_continue_clicked", { course: slug, from: "plan" })}
      className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
    >
      <span aria-hidden="true" className={item.done ? "text-success-dark" : "text-neutral-300"}>{item.done ? "✓" : "○"}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-neutral-900">{item.title}</span>
        <span className="block text-xs text-neutral-500">
          {KIND_LABEL[item.type]}
          {item.minutes ? ` · ${item.minutes} min` : item.type === "final_exam" ? " · opens once every lesson and chapter quiz is done" : ""}
          {item.done ? " · done" : ""}
        </span>
      </span>
    </Link>
  );
}

function PlanSettings({ plan, onChanged }: { plan: CoursePlan; onChanged: (plan: CoursePlan) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (pace: PlanPace) => {
    setBusy(true);
    setMessage("");
    try {
      const next = await planApi.setPace(plan.courseId, pace);
      track("plan_pace_changed", { to: pace, course: plan.slug });
      onChanged(next);
      setMessage(pace === "guided" ? "You're back on the guided plan. Your plan starts from where you are." : "Switched to self-paced. You can switch back at any time.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That didn't save. Try again.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <section aria-labelledby="plan-settings-heading" className="mt-10 border-t border-neutral-100 pt-6">
      <h2 id="plan-settings-heading" className="text-sm font-semibold text-neutral-700">Plan settings</h2>
      <fieldset className="mt-3 space-y-2" disabled={busy}>
        <legend className="sr-only">How you want to learn</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-neutral-800 hover:bg-neutral-50">
          <input type="radio" name="pace" value="guided" checked={plan.pace === "guided"} onChange={() => void save("guided")} className="h-4 w-4 accent-primary-800 focus-visible:ring-2 focus-visible:ring-primary-800" />
          Guided {plan.weeks}-week plan (recommended)
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-neutral-600 hover:bg-neutral-50">
          <input type="radio" name="pace" value="self_paced" checked={plan.pace === "self_paced"} onChange={() => setConfirming(true)} className="h-4 w-4 accent-neutral-500 focus-visible:ring-2 focus-visible:ring-primary-800" />
          Self-paced
        </label>
      </fieldset>
      {message && <p role="status" aria-live="polite" className="mt-2 text-sm text-neutral-600">{message}</p>}

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} title="Switch to self-paced?" size="sm">
        <p className="text-sm text-neutral-700">
          Learners on the guided plan are more likely to finish. Self-paced turns off weekly goals and reminders. You can switch back at any time.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => void save("self_paced")} disabled={busy} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800">
            Switch to self-paced
          </button>
          <button type="button" onClick={() => setConfirming(false)} autoFocus className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 focus-visible:ring-offset-2">
            Keep my plan
          </button>
        </div>
      </Modal>
    </section>
  );
}
