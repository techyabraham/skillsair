import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase on SkillsAir.",
};

export default function CheckoutRoute() {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-20">
        <CheckoutPage />
      </main>
    </AuthGuard>
  );
}
