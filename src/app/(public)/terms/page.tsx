import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that apply when you use SkillsAir.",
  alternates: { canonical: "/terms" },
};

export const revalidate = 300;

export default function Page() {
  return <LegalPage slug="terms" fallbackTitle="Terms" />;
}
