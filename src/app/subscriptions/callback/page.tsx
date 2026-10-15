import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentCallback } from "@/components/checkout/PaymentCallback";

export const metadata: Metadata = {
  title: "Confirming subscription",
  description: "Confirm your SkillsAir subscription payment.",
};

export default function SubscriptionCallbackRoute() {
  return (
    <main className="pt-20">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <p className="text-sm text-neutral-500">Confirming your subscription payment…</p>
          </div>
        }
      >
        <PaymentCallback />
      </Suspense>
    </main>
  );
}
