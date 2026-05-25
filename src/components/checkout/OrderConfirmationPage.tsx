"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/types/order";

interface OrderConfirmationPageProps {
  orderId: number;
}

interface VerificationResponse {
  paid: boolean;
  status: string;
  message?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const { data: verification, isLoading: verifying } = useSWR<VerificationResponse>(
    reference ? `/api/paystack/verify?reference=${encodeURIComponent(reference)}&orderId=${orderId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: order, isLoading } = useSWR<Order>(
    orderId ? `/api/orders/${orderId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-success-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
            Order Confirmed! 🎉
          </h1>
          <p className="text-neutral-500">
            Thank you for your purchase. Your courses are ready to access.
          </p>
        </motion.div>

        {verification && !verification.paid && (
          <div className="mb-6 rounded-2xl border border-warning bg-warning-light p-4 text-sm text-warning-dark">
            {verification.message || "Payment is still pending. If you completed payment, refresh this page in a moment."}
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-neutral-100">
              <div>
                <p className="text-sm text-neutral-400">Order Number</p>
                <p className="text-lg font-bold text-neutral-900">#{order.id}</p>
              </div>
              <Badge variant={order.status === "completed" ? "success" : "warning"}>
                {order.status === "completed" ? "Confirmed" : order.status}
              </Badge>
            </div>

            <div className="space-y-3 mb-5">
              {order.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-neutral-700">{item.name}</span>
                  <span className="font-medium text-neutral-900">{formatPrice(parseFloat(item.total))}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal</span><span>{formatPrice(parseFloat(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Tax</span><span>{formatPrice(parseFloat(order.totalTax))}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total</span><span>{formatPrice(parseFloat(order.total))}</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-neutral-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-400 text-xs mb-1">Date</p>
                <p className="font-medium">{formatDate(order.dateCreated)}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs mb-1">Payment</p>
                <p className="font-medium">{order.paymentMethodTitle}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-400 text-xs mb-1">Confirmation sent to</p>
                <p className="font-medium">{order.billing.email}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-3"
        >
          <Link href="/dashboard/courses" className="block">
            <Button variant="accent" size="lg" fullWidth>
              Start Learning Now →
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <Button variant="outline" size="lg" fullWidth>
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
