"use client";

import Link from "next/link";
import useSWR from "swr";

interface PendingExam {
  id: number;
  title: string;
  slug: string;
}

/** "Take your final exam": stays on the dashboard until the learner passes (their certificate is paid for). */
export function ExamReadyCards() {
  const { data } = useSWR<{ exams: PendingExam[] }>("/api/learning/exam-entitlements", (url: string) => fetch(url).then((response) => response.json()), { revalidateOnFocus: false });
  const exams = data?.exams ?? [];
  if (!exams.length) return null;
  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <section key={exam.id} className="flex flex-col gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label={`Final exam: ${exam.title}`}>
          <div>
            <p className="font-heading font-semibold text-neutral-900">Take your final exam: {exam.title}</p>
            <p className="mt-1 text-sm text-neutral-700">Your certificate is paid for. Pass the exam to receive it; retakes are included.</p>
          </div>
          <Link href={`/dashboard/courses/${encodeURIComponent(exam.slug)}/exam`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800">
            Take your final exam
          </Link>
        </section>
      ))}
    </div>
  );
}
