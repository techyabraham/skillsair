"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useCourse } from "@/hooks/useCourses";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { assessmentApi, lagosTime } from "@/lib/assessment-client";
import { QuizRunner } from "./QuizRunner";

/** The final exam: intro (shown right after the certificate is paid for, and from the dashboard card), then the exam. */
export function FinalExamPage({ slug }: { slug: string }) {
  const { course, isLoading } = useCourse(slug);
  const { data, error, mutate } = useSWR(course?.id ? `assessments-${course.id}` : null, () => assessmentApi.courseAssessments(course!.id), { revalidateOnFocus: false });
  const [honour, setHonour] = useState(false);
  const [started, setStarted] = useState(false);
  const exam = data?.quizzes.find((quiz) => quiz.kind === "final_exam");
  const learnHref = `/dashboard/courses/${encodeURIComponent(slug)}/learn`;
  const checkoutHref = `/checkout?certificate=${encodeURIComponent(slug)}`;

  if (isLoading || (course && !data && !error)) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Link href={learnHref} className="text-sm font-medium text-primary-800 hover:underline">← Back to {course?.title ?? "the programme"}</Link>
      <div className="mt-4">{children}</div>
    </div>
  );

  if (error || !exam) {
    return shell(
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="font-heading text-xl font-bold text-neutral-900">Final exam</h1>
        <p className="mt-2 text-neutral-600">{error ? "We couldn't load your exam. Refresh the page to try again." : "This programme doesn't have a final exam: when you buy the certificate, it's issued straight away."}</p>
        {!error && <Link href="/dashboard/certificates" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800">My certificates</Link>}
      </div>,
    );
  }

  if (started) {
    return shell(
      <QuizRunner
        quizId={exam.id}
        certificateCheckoutHref={checkoutHref}
        onClose={() => { setStarted(false); void mutate(); }}
        onFinished={() => void mutate()}
        onReviewLesson={(lessonId) => { window.location.href = `${learnHref}?lesson=${lessonId}`; }}
      />,
    );
  }

  const minutes = exam.timeLimitMinutes;
  return shell(
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8" aria-labelledby="exam-intro-title">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">{course?.title}</p>
      <h1 id="exam-intro-title" className="mt-1 font-heading text-2xl font-bold text-neutral-900">Your final exam</h1>
      {exam.locked === "finish_programme" ? (
        <p className="mt-3 text-neutral-700">Finish every lesson and chapter quiz first. The final exam opens after that, once your certificate is paid for.</p>
      ) : exam.locked === "buy_certificate" ? (
        <>
          <p className="mt-3 text-neutral-700">You&apos;ve finished the programme. Get your certificate: pay ₦10,000, then take your final exam.</p>
          <p className="mt-2 text-sm text-neutral-600">Your ₦10,000 covers your final exam (retakes included) and your certificate when you pass.</p>
          <a href={checkoutHref} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-accent-700 px-6 font-semibold text-white hover:bg-accent-800">Get my certificate</a>
        </>
      ) : exam.locked === "passed" ? (
        <>
          <p className="mt-3 text-neutral-700">You&apos;ve passed. Your certificate is ready.</p>
          <Link href="/dashboard/certificates" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-accent-700 px-6 font-semibold text-white hover:bg-accent-800">See my certificate</Link>
        </>
      ) : (
        <>
          <p className="mt-3 text-neutral-700">Your certificate is paid for. Pass this exam to receive it.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Questions", `${exam.drawCount ?? 40}, from every chapter`],
              ["Time limit", minutes ? `${minutes} minutes` : "Untimed"],
              ["Pass mark", `${exam.passingScore}%`],
              ["Attempts", exam.nextAttemptAt ? `Next attempt opens ${lagosTime(exam.nextAttemptAt)}` : `${exam.attemptsLeft ?? 3} left in this round (retakes included in your fee)`],
            ].map(([label, value]) => (
              <li key={label} className="rounded-xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
                <p className="mt-1 font-medium text-neutral-900">{value}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-neutral-700">Use Wi-Fi or a stable connection. Your answers save automatically, and the timer runs on our side, so a dropped connection won&apos;t lose your work.</p>
          {exam.inProgress && <p className="mt-2 text-sm font-medium text-accent-800">You have an exam in progress. Start to carry on where you left off.</p>}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-800">
            <input type="checkbox" checked={honour} onChange={(event) => setHonour(event.target.checked)} className="mt-0.5 h-5 w-5 accent-primary-800" />
            <span>I&apos;ll complete this exam myself, without help.</span>
          </label>
          <Button variant="accent" size="lg" className="mt-5 min-h-12" disabled={!honour || Boolean(exam.nextAttemptAt)} onClick={() => setStarted(true)}>
            {exam.inProgress ? "Continue my exam" : "Start the exam"}
          </Button>
        </>
      )}
    </section>,
  );
}
