"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { quizQuestions, schoolKey, scoreQuiz } from "@/content/quiz";
import { LeadDetailsForm } from "@/components/apply/LeadDetailsForm";
import { ProgressSteps } from "@/components/marketing/ProgressSteps";
import { track } from "@/lib/analytics";

interface QuizSchool {
  slug: string;
  name: string;
  oneLiner: string;
}

export function CareerQuiz({ schools }: { schools: QuizSchool[] }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const index = answers.length;
  const done = index >= quizQuestions.length;

  const matches = useMemo(() => {
    if (!done) return [];
    const bySchool = new Map(schools.map((school) => [schoolKey(school.name), school]));
    return scoreQuiz(answers)
      .map((result) => ({ ...result, school: bySchool.get(result.key) }))
      .filter((result): result is typeof result & { school: QuizSchool } => Boolean(result.school))
      .slice(0, 3);
  }, [answers, done, schools]);

  const top = matches[0];

  if (!done) {
    const question = quizQuestions[index]!;
    return (
      <section aria-labelledby="quiz-question">
        <ProgressSteps step={index + 1} total={quizQuestions.length} />
        <h2 id="quiz-question" className="text-xl font-heading font-bold text-neutral-900">{question.question}</h2>
        <div className="mt-5 grid gap-3">
          {question.options.map((option, optionIndex) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setAnswers((current) => [...current, optionIndex])}
              className="min-h-12 rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-left font-medium text-neutral-800 hover:border-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
            >
              {option.label}
            </button>
          ))}
        </div>
        {index > 0 && (
          <button type="button" onClick={() => setAnswers((current) => current.slice(0, -1))} className="mt-6 min-h-12 text-sm font-medium text-neutral-600">
            ← Back
          </button>
        )}
      </section>
    );
  }

  if (!unlocked) {
    return (
      <section aria-labelledby="quiz-gate">
        <h2 id="quiz-gate" className="text-2xl font-heading font-bold text-neutral-900">Your match is ready! Where should we send your results and scholarship offer?</h2>
        <div className="mt-6">
          <LeadDetailsForm
            source="quiz"
            submitLabel="Show my match →"
            school={top?.school.slug}
            onSuccess={() => {
              track("lead_captured", { source: "quiz", school: top?.school.slug ?? "" });
              track("quiz_complete", { match: top?.school.slug ?? "" });
              setUnlocked(true);
            }}
          />
        </div>
      </section>
    );
  }

  if (!top) {
    return (
      <p className="text-neutral-700">
        Thanks! We couldn&apos;t load our schools just now. <Link href="/schools" className="font-semibold text-primary-800 underline">Browse all schools</Link>.
      </p>
    );
  }

  return (
    <section aria-live="polite">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-800">Your top match</p>
      <h2 className="mt-2 text-3xl font-heading font-extrabold text-neutral-900">
        {top.school.name} ({top.score}%)
      </h2>
      {top.school.oneLiner && <p className="mt-3 text-lg text-neutral-700">{top.school.oneLiner}</p>}
      <Link href={`/apply?school=${encodeURIComponent(top.school.slug)}`} className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-6 py-3 font-semibold text-white hover:bg-accent-800 sm:inline-flex">
        Apply to {top.school.name} →
      </Link>
      {matches.length > 1 && (
        <div className="mt-10">
          <h3 className="font-heading font-semibold text-neutral-900">Your next matches</h3>
          <ul className="mt-3 grid gap-3">
            {matches.slice(1).map((match) => (
              <li key={match.key}>
                <Link href={`/schools/${match.school.slug}`} className="flex min-h-12 items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:border-primary-800">
                  <span className="font-medium text-neutral-900">{match.school.name}</span>
                  <span className="text-neutral-600">{match.score}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
