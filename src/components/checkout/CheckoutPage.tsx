"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { formatShortDate, type Offer } from "@/lib/offer";
import { naira, site } from "@/content/site";
import type { Course } from "@/types/course";

const PAYMENT_METHODS = [
  {
    id: "paystack",
    label: "Card",
    description: "Pay with your debit card, bank, USSD or QR on Paystack.",
  },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    description: "Pay from any Nigerian bank app (or send the details to whoever is paying for you).",
  },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

interface CheckoutResponse {
  orderId: number;
  authorizationUrl: string;
  reference: string;
  newAccount: boolean;
  message?: string;
}

interface CoursePlan {
  id: number;
  name: string;
  price: number;
  interval: "monthly" | "annually";
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CheckoutPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [purchaseType, setPurchaseType] = useState<"course" | "subscription">("course");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [placing, setPlacing] = useState(false);

  const courseSlug = searchParams.get("course");
  const certificateCourseSlug = searchParams.get("certificate");
  const productSlug = certificateCourseSlug || courseSlug;
  const checkoutPath = `/checkout?${certificateCourseSlug ? `certificate=${encodeURIComponent(certificateCourseSlug)}` : `course=${encodeURIComponent(courseSlug || "")}`}`;
  const signInHref = `/login?next=${encodeURIComponent(checkoutPath)}`;
  const { data: course } = useSWR<Course>(
    productSlug ? `/api/courses/${productSlug}` : null,
    fetcher
  );
  // Course prices are only revealed through the personal offer (lead or logged-in learner).
  const { data: offer } = useSWR<Offer>(
    courseSlug && !certificateCourseSlug && user ? `/api/offer/${encodeURIComponent(courseSlug)}` : null,
    fetcher,
  );
  const { data: certificateCourse } = useSWR<Course>(
    certificateCourseSlug ? `/api/courses/${certificateCourseSlug}` : null,
    fetcher
  );
  const { data: planData } = useSWR<{ plans?: CoursePlan[] }>(
    courseSlug && !certificateCourseSlug ? `/api/courses/${encodeURIComponent(courseSlug)}/plans` : null,
    fetcher,
  );
  const plans = planData?.plans || [];
  const isCertificateCheckout = Boolean(certificateCourseSlug);
  // While a window is open, the Access Scholarship is the course's ₦2,000/month plan.
  const scholarshipMonthly = !isCertificateCheckout && offer?.billing === "monthly" && Boolean(offer?.scholarshipPlanId);
  const scholarshipPlan: CoursePlan | undefined =
    scholarshipMonthly && offer?.scholarshipPlanId
      ? { id: offer.scholarshipPlanId, name: "Access Scholarship", price: offer.price, interval: "monthly" }
      : undefined;
  const selectedPlan = scholarshipPlan ?? plans.find((plan) => String(plan.id) === selectedPlanId);
  const isSubscriptionCheckout = scholarshipMonthly || (purchaseType === "subscription" && !isCertificateCheckout);
  const certificateFee = offer?.certificatePrice ?? site.programme.certificatePrice;
  const price = isCertificateCheckout
    ? certificateFee
    : isSubscriptionCheckout
      ? selectedPlan?.price ?? 0
      : offer?.effectivePrice ?? 0;
  const showScholarship = scholarshipMonthly;
  const total = price;
  const summaryTitle = isCertificateCheckout
    ? `Certificate - ${certificateCourse?.title || "Course"}`
    : course?.title;
  const summarySubtitle = isCertificateCheckout
    ? "Certificate processing fee"
    : scholarshipMonthly && offer
      ? `Access Scholarship · ${naira(offer.price)} a month · join by ${formatShortDate(offer.closesAt)}`
      : isSubscriptionCheckout && selectedPlan
      ? `${selectedPlan.name} · renews ${selectedPlan.interval === "monthly" ? "monthly" : "annually"}`
      : offer?.windowOpen
        ? `Access Scholarship · closes ${formatShortDate(offer.closesAt)}`
        : "One-time programme fee";

  const onSubmit = async () => {
    if (!user) {
      window.location.assign(signInHref);
      return;
    }
    if (!course) {
      addToast({ type: "error", title: isCertificateCheckout ? "No certificate selected" : "No course selected" });
      return;
    }
    setPlacing(true);
    track("checkout_start", { method: paymentMethod });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: course.id,
          courseSlug: productSlug,
          certificateCourseSlug,
          ...(isSubscriptionCheckout && selectedPlan ? { purchaseType: "subscription", planId: selectedPlan.id } : {}),
          // Monthly plans renew from a card, so they always go through Paystack card checkout.
          paymentMethod: isSubscriptionCheckout ? "paystack" : paymentMethod,
          paymentMethodTitle: PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label,
        }),
      });

      const data = (await res.json()) as CheckoutResponse;

      if (!res.ok) {
        throw new Error(data.message || "Order failed");
      }

      if (!data.authorizationUrl) {
        throw new Error("Paystack did not return a payment link.");
      }

      window.location.assign(data.authorizationUrl);
    } catch (err) {
      addToast({
        type: "error",
        title: "Order failed",
        message: err instanceof Error ? err.message : "Please try again or contact support.",
      });
      setPlacing(false);
    }
  };

  const payLabel = !user
    ? "Log in to continue"
    : isSubscriptionCheckout
      ? `Start ${formatPrice(total)}/${selectedPlan?.interval === "annually" ? "year" : "month"} securely →`
      : `Pay ${formatPrice(total)} securely →`;
  const loadingPrice = !isCertificateCheckout && Boolean(user) && !offer;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-3xl">
          {isCertificateCheckout ? "Claim your certificate" : "Secure your seat"}
        </h1>
        {user ? (
          <p className="mt-1 text-sm text-neutral-600">
            Paying as <span className="font-medium text-neutral-900">{user.displayName}</span> ({user.email})
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-600">
            Log in to your SkillsAir account to pay.{" "}
            <a href={signInHref} className="font-medium text-primary-800 underline">Log in</a>
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
          {/* Order summary first on phones, right-hand column on desktop. */}
          <section aria-labelledby="summary-heading" className="order-first rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 lg:order-last lg:sticky lg:top-24">
            <h2 id="summary-heading" className="sr-only">Order summary</h2>
            {course ? (
              <div className="flex gap-3 border-b border-neutral-100 pb-4">
                {course.thumbnail && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={course.thumbnail} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                )}
                <div>
                  <p className="font-heading font-semibold leading-snug text-neutral-900">{summaryTitle}</p>
                  <p className="mt-1 text-sm text-neutral-600">{summarySubtitle}</p>
                </div>
              </div>
            ) : productSlug ? (
              <div className="h-16 animate-pulse rounded-xl bg-neutral-100" />
            ) : (
              <p className="text-sm text-neutral-600">No programme selected. <a href="/apply" className="font-medium text-primary-800 underline">Apply first</a>.</p>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              {showScholarship && offer && (
                <>
                  <div className="flex justify-between gap-3 text-neutral-600">
                    <dt>Standard fee</dt>
                    <dd className="text-right">
                      <s>{offer.standardMonthlyPrice ? `${naira(offer.standardMonthlyPrice)}/month or ${naira(offer.standardPrice)} once` : naira(offer.standardPrice)}</s>
                    </dd>
                  </div>
                  <div className="flex justify-between text-success-dark">
                    <dt>Access Scholarship</dt>
                    <dd>{naira(offer.price)} a month</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-bold text-neutral-900">
                <dt>Total today</dt>
                <dd>{loadingPrice ? "…" : formatPrice(total)}</dd>
              </div>
            </dl>
            {!isCertificateCheckout && (
              <p className="mt-3 text-sm text-neutral-700">Certificate: {naira(certificateFee)}, paid only when you finish and want it.</p>
            )}
            {isSubscriptionCheckout && selectedPlan && (
              <p className="mt-2 text-sm text-neutral-700">
                Then {formatPrice(selectedPlan.price)} each {selectedPlan.interval === "monthly" ? "month" : "year"} from your card while you study
                {scholarshipMonthly ? ` (most learners finish in ${offer?.durationMonths ?? site.programme.durationMonths} months)` : ""}. Cancel anytime from your dashboard. Covers this programme only.
              </p>
            )}

            <Button
              variant="accent"
              size="lg"
              fullWidth
              loading={placing}
              className="mt-5 min-h-12"
              disabled={isAuthLoading || !course || (isSubscriptionCheckout && !selectedPlan) || loadingPrice}
              onClick={onSubmit}
            >
              {payLabel}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-600">
              <span aria-hidden="true">🔒</span> Payments secured by Paystack
            </p>
          </section>

          <div className="space-y-6">
            {!isCertificateCheckout && !scholarshipMonthly && plans.length > 0 && (
              <section aria-labelledby="plan-heading" className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
                <h2 id="plan-heading" className="font-heading font-semibold text-neutral-900">How would you like to pay?</h2>
                <div className="mt-4 space-y-3">
                  <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${purchaseType === "course" ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input type="radio" name="purchaseType" value="course" checked={purchaseType === "course"} onChange={() => setPurchaseType("course")} className="mt-1 h-4 w-4 text-primary-800" />
                    <span>
                      <span className="block font-semibold text-neutral-900">One-time payment</span>
                      <span className="mt-1 block text-sm text-neutral-600">{formatPrice(offer?.effectivePrice ?? 0)} · {offer?.durationMonths ?? site.programme.durationMonths} months to finish</span>
                    </span>
                  </label>
                  {plans.map((plan) => (
                    <label key={plan.id} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${purchaseType === "subscription" && selectedPlanId === String(plan.id) ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                      <input
                        type="radio"
                        name="purchaseType"
                        value={`plan-${plan.id}`}
                        checked={purchaseType === "subscription" && selectedPlanId === String(plan.id)}
                        onChange={() => {
                          setPurchaseType("subscription");
                          setSelectedPlanId(String(plan.id));
                        }}
                        className="mt-1 h-4 w-4 text-primary-800"
                      />
                      <span>
                        <span className="block font-semibold text-neutral-900">{plan.name}</span>
                        <span className="mt-1 block text-sm text-neutral-600">{formatPrice(plan.price)} / {plan.interval === "monthly" ? "month" : "year"} · this programme only</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="method-heading" className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
              <h2 id="method-heading" className="font-heading font-semibold text-neutral-900">Payment method</h2>
              <div className="mt-4 space-y-3">
                {isSubscriptionCheckout ? (
                  <p className="rounded-xl border-2 border-primary-800 bg-primary-50 p-4 text-neutral-800">
                    <span className="block font-semibold text-neutral-900">Card</span>
                    <span className="mt-1 block text-sm text-neutral-600">
                      Monthly payments renew from a card on Paystack. Someone paying for you can enter their own card.
                    </span>
                  </p>
                ) : PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${paymentMethod === method.id ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300"}`}
                  >
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="mt-1 h-4 w-4 text-primary-800" />
                    <span>
                      <span className="block font-semibold text-neutral-900">{method.label}</span>
                      <span className="mt-1 block text-sm text-neutral-600">{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section aria-label="Before you pay" className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 md:p-6">
              {!isCertificateCheckout && (
                <p>
                  <strong className="text-neutral-900">Fair refund promise:</strong> ask for a refund within {site.refund.windowHours} hours of paying, after completing {site.refund.minimumProgress}.{" "}
                  <a href="/refunds" className="font-medium text-primary-800 underline">Refund policy</a>
                </p>
              )}
              <p>
                <strong className="text-neutral-900">Debited but it failed?</strong> Banks normally reverse failed payments automatically. If yours hasn&apos;t, send your reference to {site.advisor.name} on WhatsApp ({site.whatsapp.display}) and we&apos;ll resolve it within {site.failedPaymentResolutionHours} hours.
              </p>
              <p>
                <strong className="text-neutral-900">Someone paying for you?</strong>{" "}
                {isSubscriptionCheckout
                  ? "They can enter their own card on the Paystack page; it renews from that card each month."
                  : "Choose Bank transfer and send them the account details Paystack shows you."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
