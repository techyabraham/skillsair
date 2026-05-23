import type { Metadata } from "next";
import { OrderHistoryPage } from "@/components/dashboard/OrderHistoryPage";

export const metadata: Metadata = { title: "Order History" };

export default function DashboardOrdersPage() {
  return <OrderHistoryPage />;
}
