"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { Course } from "@/types/course";

const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    label: "Paystack Bank Transfer",
    description: "Pay by transfer to an automated bank account",
  },
  {
    id: "paystack",
    label: "Paystack",
    description: "Pay with card, bank, USSD, QR, mobile money, or supported wallets.",
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
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
  const { data: certificateCourse } = useSWR<Course>(
    certificateCourseSlug ? `/api/courses/${certificateCourseSlug}` : null,
    fetcher
  );
  const { data: planData } = useSWR<{ plans?: CoursePlan[] }>(
    courseSlug && !certificateCourseSlug ? `/api/courses/${encodeURIComponent(courseSlug)}/plans` : null,
    fetcher,
  );
  const plans = planData?.plans || [];
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);

  const isCertificateCheckout = Boolean(certificateCourseSlug);
  const isSubscriptionCheckout = purchaseType === "subscription" && !isCertificateCheckout;
  const price = isCertificateCheckout
    ? 10000
    : isSubscriptionCheckout
      ? selectedPlan?.price ?? 0
      : course?.price ?? 0;
  const total = price;
  const summaryTitle = isCertificateCheckout
    ? `Certificate - ${certificateCourse?.title || "Course"}`
    : course?.title;
  const summarySubtitle = isCertificateCheckout
    ? "Certificate processing fee"
    : isSubscriptionCheckout && selectedPlan
      ? `${selectedPlan.name} · renews ${selectedPlan.interval === "monthly" ? "monthly" : "annually"}`
      : "One-time course purchase";

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
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: course.id,
          courseSlug: productSlug,
          certificateCourseSlug,
          ...(isSubscriptionCheckout && selectedPlan ? { purchaseType, planId: selectedPlan.id } : {}),
          paymentMethod,
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

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="container-narrow">
        <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-2">Checkout</h1>
        {!user && (
          <p className="text-sm text-neutral-500 mb-8">
            Sign in to your SkillsAir account before checkout.{" "}
            <a href={signInHref} className="text-primary-800 font-medium hover:underline">
              Sign in
            </a>
          </p>
        )}
        {user && <p className="text-sm text-neutral-500 mb-8">Signed in as <span className="font-medium">{user.email}</span></p>}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: Account and payment method */}
          <div className="lg:col-span-2 space-y-6">
            {user && (
              <section className="bg-white rounded-2xl border border-neutral-100 p-6">
                <h2 className="text-base font-semibold text-neutral-900">Payment account</h2>
                <p className="mt-2 text-sm text-neutral-600">Payment and course access will be associated with this account.</p>
                <p className="mt-4 text-sm font-medium text-neutral-900">{user.displayName}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </section>
            )}

            {!isCertificateCheckout && plans.length > 0 && (
              <section className="bg-white rounded-2xl border border-neutral-100 p-6">
                <h2 className="text-base font-semibold text-neutral-900 mb-1">How would you like to pay?</h2>
                <p className="text-sm text-neutral-500 mb-4">A subscription gives access to this course only.</p>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === "course" ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                    <input
                      type="radio"
                      name="purchaseType"
                      value="course"
                      checked={purchaseType === "course"}
                      onChange={() => setPurchaseType("course")}
                      className="mt-1 w-4 h-4 text-primary-800"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-900">Buy this course once</span>
                      <span className="block mt-1 text-xs text-neutral-500">{formatPrice(course?.price ?? 0)} · lifetime access</span>
                    </span>
                  </label>
                  {plans.map((plan) => (
                    <label key={plan.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === "subscription" && selectedPlanId === String(plan.id) ? "border-primary-800 bg-primary-50" : "border-neutral-200 hover:border-neutral-300"}`}>
                      <input
                        type="radio"
                        name="purchaseType"
                        value={`plan-${plan.id}`}
                        checked={purchaseType === "subscription" && selectedPlanId === String(plan.id)}
                        onChange={() => {
                          setPurchaseType("subscription");
                          setSelectedPlanId(String(plan.id));
                        }}
                        className="mt-1 w-4 h-4 text-primary-800"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-neutral-900">{plan.name}</span>
                        <span className="block mt-1 text-xs text-neutral-500">{formatPrice(plan.price)} / {plan.interval === "monthly" ? "month" : "year"} · access to this course</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

              <section className="bg-white rounded-2xl border border-neutral-100 p-6">
                <h2 className="text-base font-semibold text-neutral-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "border-primary-800 bg-primary-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 text-primary-800"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{method.label}</p>
                        <p className="text-xs text-neutral-400">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-900 mb-4">Order Summary</h2>

              {course ? (
                <div className="flex gap-3 mb-5 pb-5 border-b border-neutral-100">
                  {course.thumbnail && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-neutral-900 leading-snug">{summaryTitle}</p>
                    <p className="text-xs text-neutral-400 mt-1">{summarySubtitle}</p>
                  </div>
                </div>
              ) : productSlug ? (
                <div className="h-16 bg-neutral-100 rounded-xl animate-pulse mb-5" />
              ) : (
                <p className="text-sm text-neutral-400 mb-5">No course selected.</p>
              )}

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>{isCertificateCheckout ? "Certificate" : isSubscriptionCheckout ? selectedPlan?.name || "Course subscription" : "Course"}</span>
                  <span>{formatPrice(price)}</span>
                </div>
                {isSubscriptionCheckout && selectedPlan && (
                  <p className="text-xs text-neutral-500">Recurring charge: {selectedPlan.interval === "monthly" ? "monthly" : "annually"}. This plan covers this course only.</p>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-base font-bold text-neutral-900">
                  <span>Total today</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                fullWidth
                loading={placing}
                className="mt-5"
                disabled={isAuthLoading || !course || (isSubscriptionCheckout && !selectedPlan)}
                onClick={onSubmit}
              >
                {!user
                  ? `Sign in to continue - ${formatPrice(total)}`
                  : isSubscriptionCheckout
                    ? `Start ${selectedPlan?.interval === "annually" ? "annual" : "monthly"} subscription - ${formatPrice(total)}`
                    : `${paymentMethod === "bank_transfer" ? "Continue with bank transfer" : "Continue to Paystack"} - ${formatPrice(total)}`}
              </Button>

              <p className="text-xs text-neutral-400 text-center mt-3">
                Secured by Paystack and 256-bit SSL encryption
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-400 text-center">
                {isSubscriptionCheckout ? "Your subscription provides access to this course only." : "30-day money-back guarantee."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
