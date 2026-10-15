"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatPrice } from "@/lib/utils";
import { site, whatsappLink } from "@/content/site";
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

/** Shows the backend-verified state truthfully: confirmed, still pending, or not completed. */
export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const { data: verification, isLoading: verifying, mutate } = useSWR<VerificationResponse>(
    reference ? `/api/paystack/verify?reference=${encodeURIComponent(reference)}&orderId=${orderId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: order, isLoading } = useSWR<Order>(orderId ? `/api/orders/${orderId}` : null, fetcher, { revalidateOnFocus: false });
  const isCertificateOrder = order?.lineItems?.some((item) => item.name.toLowerCase().includes("certificate")) ?? false;

  if (isLoading || verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
        <Spinner size="lg" />
      </div>
    );
  }

  const confirmed = verification ? verification.paid : order?.status === "completed";
  const failed = verification?.status === "failed" || verification?.status === "abandoned" || order?.status === "failed";
  const ref = reference ?? "";

  return (
    <div className="min-h-screen bg-neutral-50 py-10 md:py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${confirmed ? "bg-success-light" : failed ? "bg-error-light" : "bg-warning-light"}`} aria-hidden="true">
            {confirmed ? "✓" : failed ? "!" : "⏳"}
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-3xl">
            {confirmed ? "Payment confirmed 🎉" : failed ? "Payment didn't go through" : "We're confirming your payment"}
          </h1>
          <p className="mt-2 text-neutral-600">
            {confirmed
              ? isCertificateOrder
                ? "Your certificate is being issued. You'll find it in your dashboard."
                : "Your seat is secured. Check WhatsApp and email for your welcome."
              : failed
                ? `If you were debited, your bank normally reverses it automatically. If it hasn't, send your reference to ${site.advisor.name} and we'll resolve it within ${site.failedPaymentResolutionHours} hours.`
                : verification?.message || "This can take a minute. Refresh to check again."}
          </p>
        </div>

        {order && (
          <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6" aria-label="Order details">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <p className="text-sm text-neutral-500">Order</p>
                <p className="text-lg font-bold text-neutral-900">#{order.id}</p>
              </div>
              {ref && <p className="text-right text-xs text-neutral-500">Reference<br /><span className="font-mono text-neutral-800">{ref}</span></p>}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {order.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <dt className="text-neutral-700">{item.name}</dt>
                  <dd className="font-medium text-neutral-900">{formatPrice(parseFloat(item.total))}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-100 pt-3 font-bold text-neutral-900">
                <dt>Total</dt>
                <dd>{formatPrice(parseFloat(order.total))}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-neutral-600">
              {formatDate(order.dateCreated)} · {order.paymentMethodTitle}
              {order.billing?.email ? ` · ${order.billing.email}` : ""}
            </p>
          </section>
        )}

        <div className="space-y-3">
          {confirmed ? (
            <Link href={isCertificateOrder ? "/dashboard/certificates" : "/dashboard/welcome"} className="flex min-h-12 items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800">
              {isCertificateOrder ? "View my certificate" : "Start learning →"}
            </Link>
          ) : failed ? (
            <a
              href={whatsappLink(`Hi ${site.advisor.name}, my SkillsAir payment didn't go through. Reference: ${ref}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center rounded-xl bg-[#075E54] font-semibold text-white"
            >
              Chat with {site.advisor.name} on WhatsApp
            </a>
          ) : (
            <button type="button" onClick={() => void mutate()} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800">
              Check again
            </button>
          )}
          <Link href="/dashboard" className="flex min-h-12 items-center justify-center rounded-xl border-2 border-primary-800 font-semibold text-primary-800 hover:bg-primary-50">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
