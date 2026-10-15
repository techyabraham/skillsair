import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How SKILLS AIR LIMITED collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export const revalidate = 300;

export default function Page() {
  return <LegalPage slug="privacy" fallbackTitle="Privacy notice" />;
}
