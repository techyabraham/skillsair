import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { VisionMission } from "@/components/about/VisionMission";
import { StatsCounter } from "@/components/about/StatsCounter";
import { WhySkillsAir } from "@/components/home/WhySkillsAir";
import { WhatYouWillGet } from "@/components/home/WhatYouWillGet";
import { AICareerTestBanner } from "@/components/home/AICareerTestBanner";

export const metadata: Metadata = {
  title: "About SkillsAir — Affordable Tech Education for Africans",
  description:
    "SkillsAir provides job-ready tech courses at pocket-friendly rates. Our mission is to make high quality tech skills affordable and accessible to all Africans.",
  openGraph: {
    title: "About SkillsAir",
    description: "Affordable tech education for Africans.",
    url: "https://skillsair.com/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <VisionMission />
      <StatsCounter />
      <WhySkillsAir />
      <WhatYouWillGet />
      <AICareerTestBanner />
    </>
  );
}
