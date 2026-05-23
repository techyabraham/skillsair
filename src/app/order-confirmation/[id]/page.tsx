import type { Metadata } from "next";
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
        <OrderConfirmationPage orderId={Number(params.id)} />
      </main>
    </>
  );
}
