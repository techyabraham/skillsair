import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase on SkillsAir.",
};

export default function CheckoutRoute() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>}>
          <CheckoutPage />
        </Suspense>
      </main>
    </>
  );
}
