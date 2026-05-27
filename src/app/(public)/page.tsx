import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import {
  CareerQuizSection,
  HowSkillsAirWorksSection,
  InvestInYourselfSection,
  WhatYouGetSection,
  WhySkillsAirSection,
} from "@/components/home/BrandContentSections";

export const metadata: Metadata = {
  title: "SkillsAir — Learn Without Limits",
  description:
    "Join 50,000+ learners advancing their careers with expert-led online courses. Get certified. Build real skills. Start free today.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CareerQuizSection />
      <StatsSection />
      <WhySkillsAirSection />
      <WhatYouGetSection />
      <FeaturedCourses />
      <CategoriesSection />
      <HowSkillsAirWorksSection />
      <TestimonialsSection />
      <InvestInYourselfSection />
      <CtaBanner />
    </>
  );
}
