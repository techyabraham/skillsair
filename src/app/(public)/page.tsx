import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { AICareerTestBanner } from "@/components/home/AICareerTestBanner";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { WhySkillsAir } from "@/components/home/WhySkillsAir";
import { WhatYouWillGet } from "@/components/home/WhatYouWillGet";
import { HowItWorks } from "@/components/home/HowItWorks";
import { StatsSection } from "@/components/home/StatsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import { NoMoreExcuses } from "@/components/home/NoMoreExcuses";

export const metadata: Metadata = {
  title: "SkillsAir — Learn Without Limits",
  description:
    "Join 50,000+ learners advancing their careers with expert-led online courses. Get certified. Build real skills. Start free today.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCourses />
      <HowItWorks />
      <CategoriesSection />
      <AICareerTestBanner />
      <WhatYouWillGet />
      <WhySkillsAir />
      <StatsSection />
      <TestimonialsSection />
      <CtaBanner />
      <NoMoreExcuses />
    </>
  );
}
