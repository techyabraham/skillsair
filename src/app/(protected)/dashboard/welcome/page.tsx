import type { Metadata } from "next";
import { WelcomeChecklist } from "@/components/dashboard/WelcomeChecklist";

export const metadata: Metadata = {
  title: "Welcome to SkillsAir",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return <WelcomeChecklist />;
}
