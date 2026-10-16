"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { wooApi } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Subscription } from "@/types/order";

export function SubscriptionPage() {
  const { user } = useAuth();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const { data: subscriptions, isLoading, mutate } = useSWR<Subscription[]>(
    user ? `/subscriptions/${user.id}` : null,
    () => wooApi.getSubscriptions(user!.id),
    { revalidateOnFocus: false },
  );

  const active = (subscriptions || []).filter((subscription) => subscription.status === "active");
  const history = (subscriptions || []).filter((subscription) => subscription.status !== "active");

  const cancelSubscription = async (subscription: Subscription) => {
    if (!window.confirm(`Cancel ${subscription.planName}? Access to that course remains until the current billing period ends.`)) return;
    setCancellingId(subscription.id);
    setActionError("");
    try {
      await wooApi.cancelSubscription(subscription.id);
      await mutate();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not cancel the subscription. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-2">My Subscriptions</h1>
      <p className="text-sm text-neutral-500 mb-8">Each subscription gives access to its selected course only.</p>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton rounded className="h-48 w-full" />
          <Skeleton rounded className="h-24 w-full" />
        </div>
      ) : active.length ? (
        <div className="space-y-5">
          {active.map((subscription) => (
            <section key={subscription.id} className="bg-hero-gradient rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Course plan</p>
                    <h2 className="text-2xl font-heading font-bold text-white">{subscription.planName}</h2>
                  </div>
                  <Badge variant="success" className="bg-success/20 text-success border border-success/30">Active</Badge>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {formatPrice(Number(subscription.total))}
                  <span className="text-white/60 text-base font-normal ml-1">/ {subscription.billingPeriod}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/20">
                  <div>
                    <p className="text-white/40 text-xs">Started</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(subscription.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Next billing</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(subscription.nextPaymentDate)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="md"
                  loading={cancellingId === subscription.id}
                  disabled={cancellingId !== null}
                  onClick={() => cancelSubscription(subscription)}
                  className="mt-5 bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel this course subscription
                </Button>
              </div>
            </section>
          ))}
          {actionError && <p role="alert" className="text-sm text-error">{actionError}</p>}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <div className="text-5xl mb-4" aria-hidden="true">💳</div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">No Active Subscriptions</h2>
          <p className="text-sm text-neutral-500 mb-6">Choose a course to see its one-time and subscription payment options.</p>
          <Link href="/schools"><Button variant="accent" size="md">Browse Courses</Button></Link>
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-8 bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Past subscriptions</h2>
          <ul className="divide-y divide-neutral-100">
            {history.map((subscription) => (
              <li key={subscription.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                <span className="text-neutral-700">{subscription.planName}</span>
                <span className="text-neutral-500 capitalize">{subscription.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
