import type { Metadata } from "next";
import { CareerQuiz } from "@/components/quiz/CareerQuiz";
import { getSchools, type SchoolSummary } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Career Match quiz: find your tech career in 2 minutes",
  description: "Answer 8 quick questions to see which SkillsAir school fits you best. Free, and you get your scholarship offer too.",
  alternates: { canonical: "/quiz" },
};

export const revalidate = 300;

export default async function QuizPage() {
  const schools = await getSchools().catch((): SchoolSummary[] => []);
  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        <h1 className="text-[2rem] font-heading font-extrabold leading-tight text-neutral-900 md:text-[2.75rem]">Find your tech career match in 2 minutes</h1>
        <p className="mt-3 text-neutral-600">8 quick questions. Simple, transparent scoring, no tricks.</p>
        <div className="mt-8">
          <CareerQuiz schools={schools.map(({ slug, name, oneLiner }) => ({ slug, name, oneLiner }))} />
        </div>
      </div>
    </div>
  );
}
