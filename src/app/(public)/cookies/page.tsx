import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How SkillsAir uses cookies.",
  alternates: { canonical: "/cookies" },
};

export const revalidate = 300;

export default function Page() {
  return <LegalPage slug="cookies" fallbackTitle="Cookie policy" />;
}
