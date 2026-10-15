import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Laptop support",
  description: " official rules:Official rules for the SkillsAir laptop support promotion for certified graduates.",
  alternates: { canonical: "/laptop-rules" },
};

export const revalidate = 300;

export default function Page() {
  return <LegalPage slug="laptop-rules" fallbackTitle="Laptop support" />;
}
