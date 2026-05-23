"use client";

import React from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { wooApi } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import type { Subscription } from "@/types/order";
import Link from "next/link";

export function SubscriptionPage() {
  const { user } = useAuth();
  const { data: subscriptions, isLoading } = useSWR<Subscription[]>(
    user ? `/subscriptions/${user.id}` : null,
    () => wooApi.getSubscriptions(user!.id),
    { revalidateOnFocus: false }
  );

  const active = subscriptions?.find((s) => s.status === "active");

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">My Subscription</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton rounded className="h-48 w-full" />
          <Skeleton rounded className="h-24 w-full" />
        </div>
      ) : active ? (
        <>
          {/* Active Plan */}
          <div className="bg-hero-gradient rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Current Plan</p>
                  <h2 className="text-2xl font-heading font-bold">{active.planName}</h2>
                </div>
                <Badge variant="success" className="bg-success/20 text-success border border-success/30">
                  Active
                </Badge>
              </div>

              <div className="text-3xl font-bold mb-1">
                {active.total}
                <span className="text-white/60 text-base font-normal ml-1">
                  / {active.billingPeriod}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/20">
                <div>
                  <p className="text-white/40 text-xs">Started</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(active.startDate)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Next Billing</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(active.nextPaymentDate)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Payment Method</p>
                  <p className="text-sm font-medium mt-0.5">{active.paymentMethodTitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Manage Subscription</h3>
            <Link href="/checkout">
              <Button variant="primary" size="md" fullWidth>
                Upgrade Plan
              </Button>
            </Link>
            <Button variant="ghost" size="md" fullWidth className="text-neutral-400 hover:text-error">
              Cancel Subscription
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <div className="text-5xl mb-4">💳</div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">No Active Subscription</h2>
          <p className="text-sm text-neutral-400 mb-6">Subscribe to access unlimited courses</p>
          <Link href="/checkout">
            <Button variant="accent" size="md">View Plans</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
