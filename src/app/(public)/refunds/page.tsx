import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How to request a refund of your SkillsAir programme fee.",
  alternates: { canonical: "/refunds" },
};

export const revalidate = 300;

export default function Page() {
  return <LegalPage slug="refunds" fallbackTitle="Refund policy" />;
}
