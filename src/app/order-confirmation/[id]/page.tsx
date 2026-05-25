import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmationPage } from "@/components/checkout/OrderConfirmationPage";
import { Header } from "@/components/layout/Header";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been confirmed.",
};

export default function OrderConfirmationRoute({ params }: PageProps) {
  return (
    <>
      <Header />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>}>
          <OrderConfirmationPage orderId={Number(params.id)} />
        </Suspense>
      </main>
    </>
  );
}
