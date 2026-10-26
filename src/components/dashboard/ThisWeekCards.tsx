"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { guidedPlanOn } from "@/content/site";
import { track } from "@/lib/analytics";
import { lagosDay, planApi, planKeys, PlanError, STATUS_CHIP, statusLabel, timeLeft, weekCompletedOnce } from "@/lib/plan-client";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PlanSummary } from "@/types/plan";

const MAX_CARDS = 3;

/**
 * "This week" on the dashboard: one card per guided programme (newest first, up to 3), a slim
 * line for self-paced ones. Powered by one call (/plans/me). Guidance only: nothing is locked.
 * Never blocks the rest of the dashboard: errors show one line.
 */
export function ThisWeekCards() {
  const { data, error, isLoading, mutate } = useSWR(guidedPlanOn ? planKeys.mine : null, planApi.mine, { revalidateOnFocus: false });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    for (const plan of data?.plans ?? []) {
      if (plan.pace === "guided" && plan.thisWeek.totalCount > 0 && plan.thisWeek.doneCount === plan.thisWeek.totalCount && weekCompletedOnce(plan.courseId, plan.thisWeek.week)) {
        track("plan_week_completed", { week: plan.thisWeek.week, course: plan.slug });
      }
    }
  }, [data]);

  if (!guidedPlanOn) return null;
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading your plan" className="rounded-2xl border border-neutral-100 bg-white p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-6 w-2/3" />
        <Skeleton className="mt-4 h-2 w-full" />
        <Skeleton className="mt-4 h-11 w-48" />
      </div>
    );
  }
  // A FEATURE_DISABLED answer means the plan is switched off on the server: show nothing.
  if (error instanceof PlanError && error.code === "FEATURE_DISABLED") return null;
  if (error) {
    return (
      <p role="status" className="rounded-2xl border border-neutral-100 bg-white p-4 text-sm text-neutral-600">
        We couldn&apos;t load your plan. Refresh to try again.
      </p>
    );
  }
  const plans = data?.plans ?? [];
  if (!plans.length) return null;
  const shown = showAll ? plans : plans.slice(0, MAX_CARDS);

  return (
    <section aria-labelledby="this-week-heading" className="space-y-3">
      <h2 id="this-week-heading" className="text-lg font-heading font-semibold text-neutral-900">
        This week
      </h2>
      {shown.map((plan) => (plan.pace === "self_paced" ? <SelfPacedCard key={plan.courseId} plan={plan} /> : <GuidedCard key={plan.courseId} plan={plan} onChanged={() => void mutate()} />))}
      {plans.length > MAX_CARDS && !showAll && (
        <button type="button" onClick={() => setShowAll(true)} className="min-h-11 rounded-lg px-2 text-sm font-medium text-primary-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800">
          See all ({plans.length})
        </button>
      )}
    </section>
  );
}

function GuidedCard({ plan, onChanged }: { plan: PlanSummary; onChanged: () => void }) {
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState("");
  const week = plan.thisWeek;
  const percent = week.totalCount ? Math.round((week.doneCount / week.totalCount) * 100) : 0;
  const behind = plan.status === "behind" || plan.status === "overrun";
  const chip = plan.status ? STATUS_CHIP[plan.status] : null;

  const move = async () => {
    setMoving(true);
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
      setMoving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card" aria-label={`${plan.title}: week ${plan.currentWeek} of ${plan.weeks}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Week {plan.currentWeek} of {plan.weeks}
          </p>
          <p className="mt-1 font-heading font-semibold text-neutral-900">{plan.title}</p>
        </div>
        {chip && plan.status && <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${chip.className}`}>{statusLabel(plan.status, plan.weeksBehind)}</span>}
      </div>

      {week.totalCount > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={week.doneCount} aria-valuemin={0} aria-valuemax={week.totalCount} aria-label={`This week: ${week.doneCount} of ${week.totalCount} done`}>
            <div className="h-full rounded-full bg-primary-800 transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            {week.doneCount} of {week.totalCount} done{week.minutesLeft > 0 ? ` · ${timeLeft(week.minutesLeft)} left` : ""}
          </p>
        </div>
      )}

      {behind && (
        <div className="mt-4 rounded-xl bg-warning-light/60 p-3 text-sm text-neutral-800">
          <p>Life happens. Catch up this week or move your plan so it fits.</p>
          {plan.canReset ? (
            <button type="button" onClick={move} disabled={moving} className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 disabled:opacity-60">
              {moving ? "Moving…" : "Move my plan"}
            </button>
          ) : plan.resetAvailableAt ? (
            <p className="mt-1 text-neutral-600">You can move your plan again on {lagosDay(plan.resetAvailableAt)}.</p>
          ) : null}
        </div>
      )}
      {message && (
        <p role="status" aria-live="polite" className="mt-2 text-sm text-neutral-600">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {plan.nextItem && (
          <Link
            href={plan.nextItem.href}
            onClick={() => track("plan_continue_clicked", { course: plan.slug, from: "dashboard" })}
            className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 focus-visible:ring-offset-2"
          >
            <span className="truncate">Continue: {plan.nextItem.title}</span>
          </Link>
        )}
        <Link href={`/dashboard/courses/${encodeURIComponent(plan.slug)}/plan`} className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-primary-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800">
          See my plan
        </Link>
      </div>
    </article>
  );
}

function SelfPacedCard({ plan }: { plan: PlanSummary }) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label={`${plan.title}, self-paced`}>
      <p className="min-w-0 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">{plan.title}</span> · Self-paced{plan.nextItem ? ` · Next: ${plan.nextItem.title}` : ""}
      </p>
      {plan.nextItem && (
        <Link href={plan.nextItem.href} onClick={() => track("plan_continue_clicked", { course: plan.slug, from: "dashboard" })} className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-primary-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800">
          Continue
        </Link>
      )}
    </article>
  );
}
