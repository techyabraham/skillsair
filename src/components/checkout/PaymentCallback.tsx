"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { site, whatsappLink } from "@/content/site";
import { track } from "@/lib/analytics";

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
        return data as { orderId?: number; paid?: boolean; status?: string; type?: string; amount?: number };
      })
      .then(({ orderId, paid, status, type, amount }) => {
        if (cancelled) return;
        if (paid) {
          track("payment_success", { value: amount ?? 0, currency: "NGN", type: type ?? "" });
          if (type === "course" || type === "subscription") {
            router.replace(`/dashboard/welcome?order=${orderId ?? ""}`);
            return;
          }
        }
        if (status === "failed" || status === "abandoned") {
          setError("Your payment was not completed.");
          return;
        }
        if (orderId) router.replace(`/order-confirmation/${orderId}?reference=${encodeURIComponent(reference)}`);
        else setError("We could not find the related order.");
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
            <h1 className="text-xl font-semibold text-neutral-900">Payment didn&apos;t go through</h1>
            <p className="mt-3 text-sm text-neutral-600">{error}</p>
            <p className="mt-3 text-sm text-neutral-700">
              If you were debited, your bank normally reverses it automatically. If it hasn&apos;t, send your reference
              {reference ? <> <strong>{reference}</strong></> : null} to {site.advisor.name} on WhatsApp ({site.whatsapp.display}) and we&apos;ll resolve it within 24 hours.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <a className="inline-flex min-h-12 items-center rounded-xl bg-[#128C7E] px-5 font-semibold text-white" href={whatsappLink(`Hi ${site.advisor.name}, my SkillsAir payment didn't go through. Reference: ${reference}`)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="text-primary-800 underline" href="/dashboard/orders">View your orders</Link>
            </div>
          </>
        ) : (
          <><Spinner size="lg" /><h1 className="mt-4 text-lg font-semibold text-neutral-900">Confirming your payment</h1></>
        )}
      </div>
    </main>
  );
}
