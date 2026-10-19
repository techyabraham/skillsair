"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { wooApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Subscription } from "@/types/order";

/**
 * Shown across the dashboard while a monthly renewal has failed and the learner is in the
 * grace period. Shares the subscription list cache with the Subscriptions page.
 */
export function PastDueBanner() {
  const { user } = useAuth();
  const { data: subscriptions } = useSWR<Subscription[]>(
    user ? `/subscriptions/${user.id}` : null,
    () => wooApi.getSubscriptions(user!.id),
    { revalidateOnFocus: false },
  );
  const pastDue = (subscriptions || []).find((subscription) => subscription.status === "past_due");
  if (!pastDue) return null;

  return (
    <div role="alert" className="border-b border-warning/40 bg-warning-light px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-900">
          <strong>Your ₦2,000 payment didn&apos;t go through.</strong>{" "}
          {pastDue.graceEndsAt ? `Update your card by ${formatDate(pastDue.graceEndsAt)} to keep learning.` : "Update your card to keep learning."}
        </p>
        <a
          href={`/billing/update-card?subscription=${pastDue.id}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
        >
          Update my card
        </a>
      </div>
    </div>
  );
}
