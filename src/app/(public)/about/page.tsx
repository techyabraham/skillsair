import type { Metadata } from "next";
import {
  AboutIntroSection,
  AboutStatsSection,
  CareerQuizSection,
  WhatYouGetSection,
  WhySkillsAirSection,
} from "@/components/home/BrandContentSections";

export const metadata: Metadata = {
  title: "About SkillsAir",
  description:
    "Learn how SkillsAir makes job-ready tech courses affordable and accessible for African learners.",
};

export default function AboutPage() {
  return (
    <>
      <AboutIntroSection />
      <AboutStatsSection />
      <WhySkillsAirSection />
      <WhatYouGetSection />
      <CareerQuizSection />
    </>
  );
}
