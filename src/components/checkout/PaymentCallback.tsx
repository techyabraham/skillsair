"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export function PaymentCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const reference = params.get("reference") || params.get("trxref") || "";

  useEffect(() => {
    if (!reference) {
      setError("The payment reference is missing.");
      return;
    }
    let cancelled = false;
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Payment verification failed.");
        return data as { orderId?: number };
      })
      .then(({ orderId }) => {
        if (!cancelled && orderId) router.replace(`/order-confirmation/${orderId}?reference=${encodeURIComponent(reference)}`);
        else if (!cancelled) setError("We could not find the related order. Contact support with your payment reference.");
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Payment verification failed.");
      });
    return () => { cancelled = true; };
  }, [reference, router]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-neutral-900">Payment status unavailable</h1>
            <p className="mt-3 text-sm text-neutral-600">{error}</p>
            {reference && <p className="mt-3 text-xs text-neutral-500">Reference: {reference}</p>}
            <Link className="mt-6 inline-block text-primary-800 underline" href="/dashboard/orders">View your orders</Link>
          </>
        ) : (
          <><Spinner size="lg" /><h1 className="mt-4 text-lg font-semibold text-neutral-900">Confirming your payment</h1></>
        )}
      </div>
    </main>
  );
}
