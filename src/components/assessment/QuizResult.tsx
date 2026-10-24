"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { lagosTime, timestampSeconds } from "@/lib/assessment-client";
import type { AttemptQuestion, AttemptResult } from "@/types/assessment";

interface QuizResultProps {
  result: AttemptResult;
  questions: AttemptQuestion[];
  compact?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
  onReviewLesson?: (lessonId: number, seconds: number | null) => void;
}

const LETTERS = "ABCDEF";

/** Results: explanations for chapter quizzes and knowledge checks; score, chapters and the certificate for the exam. */
export function QuizResult({ result, questions, compact = false, onRetry, onClose, onReviewLesson }: QuizResultProps) {
  const kind = result.quiz.kind;
  const byId = new Map(questions.map((question) => [question.id, question]));

  if (kind === "final_exam") return <ExamResult result={result} onRetry={onRetry} onClose={onClose} onReviewLesson={onReviewLesson} />;

  const right = result.feedback?.filter((item) => item.correct).length ?? 0;
  return (
    <section className={cn("bg-white", compact ? "rounded-2xl border border-neutral-200 p-4 sm:p-5" : "")} aria-live="polite">
      <h2 className="font-heading text-lg font-bold text-neutral-900">
        {kind === "knowledge_check"
          ? `${right} of ${result.feedback?.length ?? 0} right`
          : result.passed ? `Passed: ${result.score}%` : `${result.score}%: not quite`}
      </h2>
      {kind === "chapter" && (
        <p className="mt-1 text-sm text-neutral-600">
          {result.passed ? "Chapter quiz passed. On to the next chapter." : `You need ${result.quiz.passingScore}% to pass. Read the explanations below, then try again.`}
        </p>
      )}
      <ol className="mt-4 space-y-4">
        {(result.feedback ?? []).map((item, index) => {
          const question = byId.get(item.questionId);
          if (!question) return null;
          const seconds = timestampSeconds(item.sourceTimestamp);
          return (
            <li key={item.questionId} className="rounded-xl border border-neutral-200 p-4">
              <p className="font-medium text-neutral-900">
                <span aria-hidden="true" className={item.correct ? "text-success-dark" : "text-error"}>{item.correct ? "✓" : "✗"}</span>{" "}
                <span className="sr-only">{item.correct ? "Correct." : "Incorrect."}</span>
                {index + 1}. {question.prompt}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {question.options.map((option, position) => {
                  const isRight = item.correctOptions.includes(position);
                  const picked = item.chosen.includes(position);
                  return (
                    <li key={position} className={cn("rounded-lg px-3 py-1.5", isRight ? "bg-success-light text-success-dark" : picked ? "bg-error-light text-error-dark" : "text-neutral-600")}>
                      {LETTERS[position]}. {option}
                      {isRight ? " (right answer)" : picked ? " (your answer)" : ""}
                    </li>
                  );
                })}
              </ul>
              {item.explanation && <p className="mt-2 text-sm text-neutral-700">{item.explanation}</p>}
              {item.lessonId && onReviewLesson && (
                <button type="button" onClick={() => onReviewLesson(item.lessonId as number, seconds)} className="mt-2 min-h-10 text-sm font-medium text-primary-800 underline underline-offset-2">
                  {seconds !== null ? `Rewatch from ${item.sourceTimestamp}` : "Review lesson"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {result.nextAttemptAt && <p className="mt-4 text-sm text-neutral-600">You&apos;ve used 3 attempts in a row. Take a short break: your next attempt opens {lagosTime(result.nextAttemptAt)}.</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {onRetry && !result.passed && !result.nextAttemptAt && <Button variant="accent" onClick={onRetry}>Try again</Button>}
        {onClose && <Button variant={result.passed ? "accent" : "ghost"} onClick={onClose}>{kind === "knowledge_check" ? "Continue" : "Back to lessons"}</Button>}
      </div>
    </section>
  );
}

function Confetti() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 3500);
    return () => window.clearTimeout(timer);
  }, []);
  if (!show) return null;
  const colours = ["#f97316", "#1e3a8a", "#16a34a", "#fbbf24"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <span
          key={i}
          className="absolute top-[-10px] block h-2 w-1.5 animate-[confetti-fall_3s_ease-in_forwards] rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, backgroundColor: colours[i % colours.length], animationDelay: `${(i % 12) * 0.08}s`, transform: `rotate(${i * 23}deg)` }}
        />
      ))}
    </div>
  );
}

function ExamResult({ result, onRetry, onClose, onReviewLesson }: Pick<QuizResultProps, "result" | "onRetry" | "onClose" | "onReviewLesson">) {
  const certificate = result.certificate;
  if (result.passed) {
    const band = certificate?.scoreBand === "distinction" ? "Passed with distinction" : "Passed";
    const verifyUrl = certificate ? `${typeof window === "undefined" ? "" : window.location.origin}/certificates/verify/${certificate.code}` : "";
    const linkedIn = certificate
      ? `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(result.quiz.title.replace(/^Final exam:\s*/, ""))}&organizationName=SkillsAir&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(certificate.code)}`
      : "";
    return (
      <section className="rounded-2xl border border-success/30 bg-success-light/40 p-6 text-center" aria-live="polite">
        <Confetti />
        <p className="text-4xl" aria-hidden="true">🎓</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900">{band}: {result.score}%</h2>
        <p className="mt-2 text-neutral-700">{certificate ? "Your certificate is ready." : "Your certificate is being prepared. It'll appear in your certificates in a few minutes."}</p>
        {certificate && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={`/certificates/verify/${certificate.code}`} className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800">View certificate</a>
            <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border-2 border-primary-800 px-5 text-sm font-semibold text-primary-800 hover:bg-primary-50">Download PDF</a>
            <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border-2 border-neutral-300 px-5 text-sm font-semibold text-neutral-800 hover:bg-white">Add to LinkedIn</a>
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6" aria-live="polite">
      <h2 className="font-heading text-xl font-bold text-neutral-900">{result.score}%: not this time</h2>
      <p className="mt-1 text-sm text-neutral-600">You need {result.quiz.passingScore}% to pass. Your fee covers your retakes.</p>
      <h3 className="mt-5 text-sm font-semibold text-neutral-900">By chapter</h3>
      <ul className="mt-2 space-y-2">
        {result.perSection.map((section) => (
          <li key={String(section.sectionId)} className="text-sm">
            <div className="flex justify-between gap-3"><span className="text-neutral-700">{section.title || "Chapter"}</span><span className="tabular-nums text-neutral-500">{section.correct}/{section.total}</span></div>
            <div className="mt-1 h-2 rounded-full bg-neutral-100" role="img" aria-label={`${section.percent}%`}>
              <div className={cn("h-2 rounded-full", section.percent >= result.quiz.passingScore ? "bg-success" : "bg-accent-500")} style={{ width: `${section.percent}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {result.chaptersToReview.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-neutral-900">Review these chapters</h3>
          <ul className="mt-2 space-y-1">
            {result.chaptersToReview.map((section) => (
              <li key={String(section.sectionId)}>
                {section.firstLessonId && onReviewLesson ? (
                  <button type="button" onClick={() => onReviewLesson(section.firstLessonId as number, null)} className="min-h-10 text-left text-sm font-medium text-primary-800 underline underline-offset-2">{section.title}</button>
                ) : <span className="text-sm text-neutral-700">{section.title}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-5 text-sm text-neutral-700">
        {result.nextAttemptAt
          ? `You've used this round of 3 attempts. Your next attempt opens ${lagosTime(result.nextAttemptAt)}.`
          : `${result.attemptsLeft ?? 0} ${result.attemptsLeft === 1 ? "attempt" : "attempts"} left in this round.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {onRetry && !result.nextAttemptAt && <Button variant="accent" onClick={onRetry}>Try again</Button>}
        {onClose && <Button variant="ghost" onClick={onClose}>Back</Button>}
      </div>
    </section>
  );
}
