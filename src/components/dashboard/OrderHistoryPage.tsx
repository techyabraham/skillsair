"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { wooApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";

const statusConfig: Record<OrderStatus, { label: string; variant: "success" | "warning" | "error" | "neutral" | "primary" }> = {
  completed: { label: "Completed", variant: "success" },
  processing: { label: "Processing", variant: "warning" },
  pending: { label: "Awaiting payment", variant: "warning" },
  "on-hold": { label: "On Hold", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "error" },
  refunded: { label: "Refunded", variant: "primary" },
  failed: { label: "Failed", variant: "error" },
};

export function OrderHistoryPage() {
  const { user } = useAuth();
  const [checking, setChecking] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const { data: orders, isLoading, mutate } = useSWR<Order[]>(
    user ? `/orders/${user.id}` : null,
    () => wooApi.getOrders(user!.id),
    { revalidateOnFocus: false }
  );

  /**
   * Complete a pending order: first ask Paystack whether it was actually paid (a transfer can
   * arrive after the learner left the page); if not, pay for the same item again at checkout.
   */
  const completePayment = async (order: Order) => {
    if (!order.completeHref) return;
    setChecking(order.id);
    setNotice("");
    try {
      const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(order.orderKey)}`, { cache: "no-store" });
      const result = (await response.json().catch(() => ({}))) as { paid?: boolean; status?: string };
      if (result.paid) {
        setNotice(`Good news: order #${order.id} was already paid. Your access is ready.`);
        await mutate();
        setChecking(null);
        return;
      }
      if (result.status && ["ongoing", "pending", "processing", "queued"].includes(result.status)) {
        setNotice(`Paystack is still confirming a payment for order #${order.id}. Check back in a few minutes before paying again.`);
        setChecking(null);
        return;
      }
    } catch {
      // Couldn't check; continue to checkout (the backend still refuses a double plan).
    }
    window.location.assign(order.completeHref);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">Order History</h1>
      {notice && (
        <p role="status" className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-neutral-800">{notice}</p>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} rounded className="h-16 w-full" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🛒</div>
            <p className="font-semibold text-neutral-700">No orders yet</p>
            <p className="text-sm text-neutral-400 mt-1">Your order history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-semibold text-neutral-500 px-5 py-3.5">Order</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 px-5 py-3.5">Date</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 px-5 py-3.5">Items</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {orders.map((order) => {
                  const status = statusConfig[order.status] ?? { label: order.status, variant: "neutral" };
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">#{order.id}</p>
                        <p className="text-xs text-neutral-400 font-mono">{order.orderKey.slice(-8)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-700">{formatDate(order.dateCreated)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-600">
                          {order.lineItems.map((i) => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatPrice(parseFloat(order.total), order.currency || "NGN")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {order.status === "pending" && order.completeHref && (
                          <button
                            type="button"
                            onClick={() => void completePayment(order)}
                            disabled={checking !== null}
                            aria-label={`Complete payment for order #${order.id}`}
                            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl bg-accent-700 px-4 text-sm font-semibold text-white hover:bg-accent-800 disabled:opacity-60"
                          >
                            {checking === order.id ? "Checking…" : "Complete payment"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
