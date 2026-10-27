"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { guidedPlanOn } from "@/content/site";
import { track } from "@/lib/analytics";
import { DAY_NAME, DAY_SHORT, lagosDay, planApi, planDate, planKeys, PlanError, STATUS_CHIP, statusLabel } from "@/lib/plan-client";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { DayState, PlanItem, PlanSummary } from "@/types/plan";

/**
 * Today on the dashboard: one large card for the programme that needs attention most (behind
 * first, then today's lessons still open, then the most recently active), smaller cards for the
 * other guided programmes and a slim line for chapter view. One call (/plans/me). Guidance only:
 * nothing is locked, and learners can always go ahead. Errors never block the dashboard.
 */
export function TodayPlans() {
  const { data, error, isLoading, mutate } = useSWR(guidedPlanOn ? planKeys.mine : null, planApi.mine, { revalidateOnFocus: false });

  if (!guidedPlanOn) return null;
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading your plan" className="rounded-[20px] border border-neutral-200 bg-white p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-7 w-2/3" />
        <div className="mt-5 grid grid-cols-5 gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" rounded />)}</div>
        <Skeleton className="mt-5 h-16 w-full" rounded />
      </div>
    );
  }
  if (error instanceof PlanError && error.code === "FEATURE_DISABLED") return null;
  if (error) {
    return <p role="status" className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">We couldn&apos;t load your plan. Refresh to try again.</p>;
  }
  const plans = data?.plans ?? [];
  const guided = plans.filter((plan) => plan.pace === "guided").sort((a, b) => attention(b) - attention(a) || activity(b) - activity(a));
  const chapters = plans.filter((plan) => plan.pace === "chapters");
  if (!plans.length) return null;
  const [first, ...rest] = guided;
  const refresh = () => void mutate();

  return (
    <div className="space-y-5">
      {first && <TodayCard plan={first} onChanged={refresh} />}
      {rest.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {rest.map((plan) => <SmallCard key={plan.courseId} plan={plan} onChanged={refresh} />)}
        </div>
      )}
      {chapters.map((plan) => <ChapterViewCard key={plan.courseId} plan={plan} />)}
    </div>
  );
}

/** Behind first, then today's lessons still open. */
function attention(plan: PlanSummary): number {
  if (plan.status === "behind" || plan.status === "overrun") return 2;
  return plan.todayItems.some((item) => !item.done) ? 1 : 0;
}
const activity = (plan: PlanSummary) => (plan.lastActivityAt ? Date.parse(plan.lastActivityAt) : 0);

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** What the card says and the button it offers, by state. */
function cardState(plan: PlanSummary) {
  const behind = plan.status === "behind" || plan.status === "overrun";
  const openToday = plan.todayItems.filter((item) => !item.done && item.type !== "final_exam");
  if (plan.status === "finished") return { kind: "finished" as const, headline: "You've finished your plan. Well done." };
  if (behind && plan.overdue.length) {
    const day = plan.overdue[0]!.plannedDay;
    const onThatDay = plan.overdue.filter((item) => item.plannedDay === day && item.plannedWeek === plan.overdue[0]!.plannedWeek);
    return {
      kind: "behind" as const,
      headline: `Catch up: ${DAY_NAME[day]}'s ${onThatDay.length === 1 ? "lesson" : "lessons"}`,
      line: `Life happens. Do ${DAY_NAME[day]}'s ${plural(onThatDay.length, "lesson")} today and you're back on track.`,
      item: plan.overdue[0]!,
    };
  }
  if (openToday.length) return { kind: "today" as const, headline: `Today: ${openToday[0]!.title}`, item: openToday[0]!, open: openToday };
  if (plan.today === "weekend") return { kind: "next" as const, headline: "It's the weekend: catch up or practise.", item: plan.nextItem };
  if (plan.todayItems.length) return { kind: "next" as const, headline: plan.status === "ahead" ? "Today's lesson is done. You're ahead." : "Today's lesson is done.", item: plan.nextItem };
  return { kind: "next" as const, headline: "No new lesson today: practise or catch up.", item: plan.nextItem };
}

function Chip({ plan, short = false }: { plan: PlanSummary; short?: boolean }) {
  if (!plan.status) return null;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full font-semibold", short ? "px-3 py-1 text-[13px]" : "px-3.5 py-2 text-[15px]", STATUS_CHIP[plan.status])}>
      {plan.status === "ahead" && (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      )}
      {statusLabel(plan.status, plan.daysAhead, plan.daysBehind, short)}
    </span>
  );
}

const TILE: Record<DayState, string> = {
  done: "border-green-200 bg-green-50 text-green-800",
  done_early: "border-blue-200 bg-blue-50 text-blue-900",
  today: "border-2 border-navy bg-white text-navy",
  missed: "border-amber-300 bg-amber-50 text-amber-900",
  upcoming: "border-neutral-200 bg-white text-neutral-600",
  free: "border-neutral-200 bg-white text-neutral-500",
};

function dayText(day: PlanSummary["days"][number]): { long: string; short: string } {
  const allDone = day.count > 0 && day.doneCount === day.count;
  if (day.state === "done" || (day.state === "today" && allDone)) return { long: "Done", short: "Done" };
  if (day.state === "done_early") return { long: "Done early", short: "Early" };
  if (day.state === "missed") return { long: "Missed", short: "Missed" };
  if (!day.count) return { long: "No lesson", short: "Free" };
  return { long: `${plural(day.count, "lesson")} · ${day.minutes} min`, short: `${day.minutes}m` };
}

/** Monday to Friday: Done (green), Done early (blue), Today (navy outline), Missed (amber) or the day's lessons. */
function DayStrip({ plan }: { plan: PlanSummary }) {
  return (
    <ol aria-label="This week" className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
      {plan.days.map((day) => {
        const today = day.state === "today";
        const text = dayText(day);
        const allDone = day.count > 0 && day.doneCount === day.count;
        return (
          <li key={day.day} className={cn("rounded-xl border px-1 py-2 text-center sm:p-3 sm:text-left", TILE[day.state], today && allDone && "bg-green-50")}>
            <p className={cn("text-xs font-semibold uppercase sm:text-[13px]", today && "font-bold")}>
              {DAY_SHORT[day.day]}
              {today && <span className="hidden sm:inline"> · Today</span>}
            </p>
            <p className={cn("mt-1 text-xs sm:mt-1.5 sm:text-sm", today && allDone && "text-green-800")}>
              <span className="sm:hidden">{today && !allDone ? "Today" : text.short}</span>
              <span className="hidden sm:inline">{text.long}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const PRIMARY = "inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-5 font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";
const SECONDARY = "inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-neutral-300 bg-white px-4 font-semibold text-navy hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60";
const LINK = "inline-flex min-h-11 items-center font-semibold text-accent-700 hover:text-accent-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy";

function useMovePlan(plan: PlanSummary, onChanged: () => void) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const move = async () => {
    setBusy(true);
    setMessage("");
    try {
      await planApi.reset(plan.courseId);
      track("plan_reset", { course: plan.slug, from: "dashboard" });
      setMessage("Done. Your plan now starts from where you are.");
      onChanged();
    } catch (err) {
      const retryAt = err instanceof PlanError ? err.fields?.retryAt : undefined;
      setMessage(retryAt ? `You can move your plan again on ${lagosDay(retryAt)}.` : err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, message, move };
}

function MoveButton({ plan, onChanged }: { plan: PlanSummary; onChanged: () => void }) {
  const { busy, message, move } = useMovePlan(plan, onChanged);
  if (!plan.canReset) {
    return plan.resetAvailableAt ? <p className="text-sm text-neutral-600">You can move your plan again on {lagosDay(plan.resetAvailableAt)}.</p> : null;
  }
  return (
    <>
      <button type="button" onClick={move} disabled={busy} className={SECONDARY}>{busy ? "Moving…" : "Move my plan"}</button>
      {message && <p role="status" aria-live="polite" className="w-full text-sm text-neutral-600">{message}</p>}
    </>
  );
}

function ItemLink({ item, label, slug, className }: { item: PlanItem; label: string; slug: string; className: string }) {
  return (
    <Link href={item.href} onClick={() => track("plan_continue_clicked", { course: slug, from: "dashboard" })} className={className}>
      {label}
    </Link>
  );
}

function TodayCard({ plan, onChanged }: { plan: PlanSummary; onChanged: () => void }) {
  const state = cardState(plan);
  const planHref = `/dashboard/courses/${encodeURIComponent(plan.slug)}/plan`;
  return (
    <section aria-label={`${plan.title} today`} className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-7">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-600 sm:text-sm">{plan.title} · Week {plan.currentWeek} of {plan.weeks}</p>
          <h2 className="mt-1.5 text-xl font-bold text-navy sm:text-[26px] sm:leading-tight">{state.headline}</h2>
        </div>
        <Chip plan={plan} />
      </div>

      <div className="px-5 sm:px-7">
        <DayStrip plan={plan} />
      </div>

      {state.kind === "behind" ? (
        <div className="mx-5 mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 sm:mx-7 sm:px-5">
          <p className="w-full text-[15px] text-neutral-800">{state.line}</p>
          <ItemLink item={state.item} slug={plan.slug} label="Catch up now" className={PRIMARY} />
          <MoveButton plan={plan} onChanged={onChanged} />
        </div>
      ) : state.kind === "today" ? (
        <div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 p-4 sm:mx-7 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm text-neutral-600">Today&apos;s {state.open.length === 1 ? "lesson" : `lessons (${state.open.length})`}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{state.item.title} <span className="font-normal text-neutral-500">· {state.item.minutes} min</span></p>
          </div>
          <ItemLink item={state.item} slug={plan.slug} label="Start today's lesson" className={cn(PRIMARY, "w-full sm:w-auto")} />
        </div>
      ) : state.kind === "next" && state.item ? (
        <div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 p-4 sm:mx-7 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm text-neutral-600">Want to keep going? Up next is {upNext(state.item, plan)}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{state.item.title} <span className="font-normal text-neutral-500">· {state.item.minutes} min</span></p>
          </div>
          <ItemLink item={state.item} slug={plan.slug} label="Keep going" className={cn(PRIMARY, "w-full sm:w-auto")} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-6 pt-4 sm:px-7">
        <Link href={planHref} className={LINK}>See this week&apos;s plan</Link>
        <span className="text-sm text-neutral-600">{plan.status === "behind" || plan.status === "overrun" ? "Finish by" : "On course to finish by"} {planDate(plan.finishBy)}</span>
      </div>
    </section>
  );
}

/** "Thursday's lesson", or "next week's Monday lesson". */
function upNext(item: PlanItem, plan: PlanSummary): string {
  if (item.type === "final_exam") return "your final exam";
  return item.plannedWeek === plan.currentWeek ? `${DAY_NAME[item.plannedDay]}'s lesson` : `week ${item.plannedWeek}'s ${DAY_NAME[item.plannedDay]} lesson`;
}

function SmallCard({ plan, onChanged }: { plan: PlanSummary; onChanged: () => void }) {
  const state = cardState(plan);
  const dayLabel = plan.today === "weekend" ? "weekend" : DAY_NAME[plan.today];
  return (
    <section aria-label={`${plan.title} today`} className="flex flex-col gap-3.5 rounded-2xl border border-neutral-200 bg-white px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-600">{plan.title} · Week {plan.currentWeek}, {dayLabel}</p>
          <h3 className="mt-1.5 text-xl font-bold text-navy">{state.headline}</h3>
        </div>
        <Chip plan={plan} short />
      </div>
      {state.kind === "behind" ? (
        <>
          <p className="text-[15px] text-neutral-600">{state.line}</p>
          <div className="flex flex-wrap items-center gap-3">
            <ItemLink item={state.item} slug={plan.slug} label="Catch up now" className={PRIMARY} />
            <MoveButton plan={plan} onChanged={onChanged} />
          </div>
        </>
      ) : (
        <>
          {state.kind === "today" ? (
            <p className="text-[15px] text-neutral-600">{plural(state.open.length, "lesson")} · {state.open.reduce((sum, item) => sum + item.minutes, 0)} min. Practise straight after.</p>
          ) : state.item ? (
            <p className="text-[15px] text-neutral-600">Next: {state.item.title} ({state.item.type === "final_exam" ? "final exam" : DAY_NAME[state.item.plannedDay]}).</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            {state.item && <ItemLink item={state.item} slug={plan.slug} label={state.kind === "today" ? "Start today's lesson" : "Keep going"} className={PRIMARY} />}
            <Link href={`/dashboard/courses/${encodeURIComponent(plan.slug)}/plan`} className={LINK}>This week</Link>
          </div>
        </>
      )}
    </section>
  );
}

function ChapterViewCard({ plan }: { plan: PlanSummary }) {
  return (
    <article aria-label={`${plan.title}, chapter view`} className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">{plan.title}</span> · Chapter view{plan.nextItem ? ` · Next: ${plan.nextItem.title}` : ""}
      </p>
      {plan.nextItem && <ItemLink item={plan.nextItem} slug={plan.slug} label="Continue" className={LINK} />}
    </article>
  );
}
