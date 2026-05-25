"use client";

import React from "react";
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
  pending: { label: "Pending", variant: "neutral" },
  "on-hold": { label: "On Hold", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "error" },
  refunded: { label: "Refunded", variant: "primary" },
  failed: { label: "Failed", variant: "error" },
};

export function OrderHistoryPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useSWR<Order[]>(
    user ? `/orders/${user.id}` : null,
    () => wooApi.getOrders(user!.id),
    { revalidateOnFocus: false }
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">Order History</h1>

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
