"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { site, whatsappLink } from "@/content/site";
import { track } from "@/lib/analytics";

/** Bank transfers can take a little while to reach Paystack: re-check this often, for this long. */
const WAIT_STEP_MS = 5_000;
const WAIT_LIMIT_MS = 120_000;
const STILL_WAITING = new Set(["pending", "ongoing", "processing", "queued"]);

export function PaymentCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState<"checking" | "transfer" | "slow">("checking");
  const reference = params.get("reference") || params.get("trxref") || "";

  useEffect(() => {
    if (!reference) {
      setError("The payment reference is missing.");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const check = () => fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
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
        // A transfer that Paystack hasn't received yet: wait here a little, then explain.
        if (status && STILL_WAITING.has(status)) {
          if (Date.now() - started < WAIT_LIMIT_MS) {
            setWaiting("transfer");
            timer = setTimeout(check, WAIT_STEP_MS);
          } else {
            setWaiting("slow");
          }
          return;
        }
        if (orderId) router.replace(`/order-confirmation/${orderId}?reference=${encodeURIComponent(reference)}`);
        else setError("We could not find the related order.");
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Payment verification failed.");
      });
    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
              <a className="inline-flex min-h-12 items-center rounded-xl bg-[#075E54] px-5 font-semibold text-white" href={whatsappLink(`Hi ${site.advisor.name}, my SkillsAir payment didn't go through. Reference: ${reference}`)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="text-primary-800 underline" href="/dashboard/orders">View your orders</Link>
            </div>
          </>
        ) : waiting === "slow" ? (
          <>
            <h1 className="text-xl font-semibold text-neutral-900">Your transfer is on its way</h1>
            <p className="mt-3 text-sm text-neutral-600">
              Paystack hasn&apos;t received it yet. Transfers usually arrive within a few minutes. As soon as it does, your access starts and we&apos;ll email you a receipt; you don&apos;t need to pay again.
            </p>
            <p className="mt-3 text-sm text-neutral-700">
              Still nothing after an hour? Send your reference{reference ? <> <strong>{reference}</strong></> : null} to {site.advisor.name} on WhatsApp ({site.whatsapp.display}).
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link className="inline-flex min-h-12 items-center rounded-xl bg-primary-800 px-5 font-semibold text-white" href="/dashboard">Go to my dashboard</Link>
            </div>
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <h1 className="mt-4 text-lg font-semibold text-neutral-900">{waiting === "transfer" ? "Waiting for your transfer to arrive" : "Confirming your payment"}</h1>
            {waiting === "transfer" ? <p className="mt-2 text-sm text-neutral-600" role="status">This usually takes a minute or two. Keep this page open.</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
