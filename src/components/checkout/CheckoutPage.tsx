"use client";

import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { wooApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const billingSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  address1: z.string().min(5, "Required"),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  postcode: z.string().min(4, "Required"),
  country: z.string().min(2, "Required"),
});

type BillingFormData = z.infer<typeof billingSchema>;

const PAYMENT_METHODS = [
  { id: "paystack", label: "Paystack", description: "Pay with card, bank transfer, or USSD" },
  { id: "flutterwave", label: "Flutterwave", description: "Pay with any method via Flutterwave" },
];

// Mock cart items — in production these come from a cart context/store
const CART_ITEMS = [
  { productId: 1, name: "Full Stack Web Development", price: 25000, quantity: 1 },
];

export function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);

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

  const subtotal = CART_ITEMS.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;

  const onSubmit: SubmitHandler<BillingFormData> = async (billing) => {
    setPlacing(true);
    try {
      const order = await wooApi.createOrder({
        payment_method: paymentMethod,
        payment_method_title: PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label,
        billing: {
          first_name: billing.firstName,
          last_name: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          address_1: billing.address1,
          city: billing.city,
          state: billing.state,
          postcode: billing.postcode,
          country: billing.country,
        },
        line_items: CART_ITEMS.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      });
      router.push(`/order-confirmation/${order.id}`);
    } catch {
      addToast({ type: "error", title: "Order failed", message: "Please try again or contact support." });
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="container-narrow">
        <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Details */}
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

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-5">
                {CART_ITEMS.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-neutral-600 flex-1 pr-3">{item.name}</span>
                    <span className="font-medium text-neutral-900 shrink-0">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-5">
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="input-field flex-1 text-xs"
                  />
                  <button className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-all">
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Tax (7.5%)</span>
                  <span>₦{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
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
              >
                Place Order · ₦{total.toLocaleString()}
              </Button>

              <p className="text-xs text-neutral-400 text-center mt-3">
                🔒 Secured by 256-bit SSL encryption
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-400 text-center">
                30-day money-back guarantee · No hidden fees · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
