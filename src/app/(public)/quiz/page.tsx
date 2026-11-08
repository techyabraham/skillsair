import type { Metadata } from "next";
import { CareerQuiz } from "@/components/quiz/CareerQuiz";
import { CareerQuizV2 } from "@/components/quiz/CareerQuizV2";
import { getSchools, type SchoolSummary } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Career Match quiz: find your tech career in 3 minutes",
  description: "15 quick taps to see which tech career fits you, with your top 3 matches and strengths. Free, and you get your scholarship offer too.",
  alternates: { canonical: "/quiz" },
};

export const revalidate = 300;

/** v2 is the default. QUIZ_VERSION=v1 brings back the old 8-question quiz until v2 is signed off. */
const useV1 = process.env.QUIZ_VERSION === "v1";

export default async function QuizPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  if (useV1) {
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

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <h1 className="text-[2rem] font-heading font-extrabold leading-tight text-neutral-900 md:text-[2.75rem]">Find your tech career match in 3 minutes</h1>
        <p className="mt-3 text-neutral-600">15 quick taps. Based on what you tell us, not a test you can fail.</p>
        <div className="mt-8">
          <CareerQuizV2 retake={searchParams.retake === "1"} />
        </div>
      </div>
    </div>
  );
}
