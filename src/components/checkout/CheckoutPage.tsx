"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { Course } from "@/types/course";

const billingSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Valid phone required"),
  address1: z.string().min(3, "Required"),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  postcode: z.string().min(2, "Required"),
  country: z.string().min(2, "Required"),
});

type BillingFormData = z.infer<typeof billingSchema>;

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CheckoutPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [placing, setPlacing] = useState(false);

  const courseSlug = searchParams.get("course");
  const certificateCourseSlug = searchParams.get("certificate");
  const productSlug = certificateCourseSlug ? "course-certificate-2" : courseSlug;
  const { data: course } = useSWR<Course>(
    productSlug ? `/api/courses/${productSlug}` : null,
    fetcher
  );
  const { data: certificateCourse } = useSWR<Course>(
    certificateCourseSlug ? `/api/courses/${certificateCourseSlug}` : null,
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      country: "NG",
    },
  });

  const price = course?.price ?? 0;
  const total = price;
  const isCertificateCheckout = Boolean(certificateCourseSlug);
  const summaryTitle = isCertificateCheckout
    ? `Certificate - ${certificateCourse?.title || "Course"}`
    : course?.title;
  const summarySubtitle = isCertificateCheckout ? "Certificate processing fee" : "Monthly subscription";

  const onSubmit: SubmitHandler<BillingFormData> = async (billing) => {
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
          billing,
          productId: course.id,
          courseSlug: productSlug,
          certificateCourseSlug,
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

      if (data.newAccount) {
        addToast({
          type: "success",
          title: "Account created!",
          message: "Continue to Paystack to complete your payment.",
        });
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
            Already have an account?{" "}
            <a href={`/login?next=/checkout${certificateCourseSlug ? `?certificate=${certificateCourseSlug}` : courseSlug ? `?course=${courseSlug}` : ""}`} className="text-primary-800 font-medium hover:underline">
              Sign in
            </a>{" "}
            to auto-fill your details.
          </p>
        )}
        {user && <p className="text-sm text-neutral-500 mb-8">Signed in as <span className="font-medium">{user.email}</span></p>}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: Billing Form */}
          <div className="lg:col-span-2 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                <h2 className="text-base font-semibold text-neutral-900 mb-5">Billing Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
                  <Input label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="Email Address" type="email" error={errors.email?.message} {...register("email")} />
                  <Input label="Phone Number" type="tel" error={errors.phone?.message} {...register("phone")} />
                </div>
                <Input label="Street Address" error={errors.address1?.message} className="mb-4" {...register("address1")} />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City" error={errors.city?.message} {...register("city")} />
                  <Input label="State" error={errors.state?.message} {...register("state")} />
                  <Input label="Postcode" error={errors.postcode?.message} {...register("postcode")} />
                </div>
                {!user && (
                  <p className="mt-4 text-xs text-neutral-400 bg-neutral-50 rounded-xl p-3">
                    A SkillsAir account will be created with your email address so you can access your course.
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 mt-6">
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
              </div>
            </form>
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
                  <span>{isCertificateCheckout ? "Certificate" : "Subscription"}</span>
                  <span>{isCertificateCheckout ? formatPrice(price) : `${formatPrice(price)}/mo`}</span>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-base font-bold text-neutral-900">
                  <span>Total today</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                form="checkout-form"
                type="submit"
                variant="accent"
                size="lg"
                fullWidth
                loading={placing}
                className="mt-5"
                disabled={!course}
              >
                Continue to Paystack - {formatPrice(total)}
              </Button>

              <p className="text-xs text-neutral-400 text-center mt-3">
                Secured by Paystack and 256-bit SSL encryption
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-400 text-center">
                30-day money-back guarantee. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
