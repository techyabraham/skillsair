import type { Metadata } from "next";
import { SubscriptionPage } from "@/components/dashboard/SubscriptionPage";

export const metadata: Metadata = { title: "My Subscription" };

export default function DashboardSubscriptionPage() {
  return <SubscriptionPage />;
}
