"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { AssessmentError, assessmentApi, lagosTime, timestampSeconds } from "@/lib/assessment-client";
import type { AttemptResult, StartedAttempt } from "@/types/assessment";
import { QuizResult } from "./QuizResult";

interface QuizRunnerProps {
  quizId: number;
  /** "compact" is the knowledge check under a video. */
  variant?: "full" | "compact";
  onClose?: () => void;
  onFinished?: (result: AttemptResult) => void;
  /** Jump to a lesson (and a moment in it) from a "Review lesson" link. */
  onReviewLesson?: (lessonId: number, seconds: number | null) => void;
  /** Shown when the backend refuses the exam because the certificate isn't paid for. */
  certificateCheckoutHref?: string;
}

type SaveState = "idle" | "saving" | "saved" | "offline";
const AUTOSAVE_MS = 5000;

function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Runs a knowledge check, chapter quiz or final exam: answers save as you go (every 5 seconds or on
 * leaving), the timer runs on the server's clock, and scoring happens on the server.
 */
export function QuizRunner({ quizId, variant = "full", onClose, onFinished, onReviewLesson, certificateCheckoutHref }: QuizRunnerProps) {
  const wide = useIsWide();
  const [attempt, setAttempt] = useState<StartedAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<AssessmentError | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dirty = useRef(false);
  const clockOffset = useRef(0);
  const announced = useRef(new Set<number>());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const begin = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const started = await assessmentApi.start(quizId);
      clockOffset.current = Date.parse(started.serverTime) - Date.now();
      announced.current = new Set();
      setAttempt(started);
      setAnswers(started.answers ?? {});
      setFlags(new Set());
      setCurrent(0);
    } catch (err) {
      setError(err instanceof AssessmentError ? err : new AssessmentError("Couldn't start. Please try again.", "ERROR", 0));
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { void begin(); }, [begin]);

  const save = useCallback(async () => {
    if (!attempt || !dirty.current) return;
    dirty.current = false;
    setSaveState("saving");
    try {
      await assessmentApi.save(attempt.attemptId, answersRef.current);
      setSaveState("saved");
    } catch (err) {
      dirty.current = true;
      if (err instanceof AssessmentError && err.code === "QUIZ_CLOSED") return;
      setSaveState("offline");
    }
  }, [attempt]);

  // Autosave: every few seconds while there are changes, retrying while offline.
  useEffect(() => {
    if (!attempt || result) return;
    const timer = window.setInterval(() => { void save(); }, AUTOSAVE_MS);
    const flush = () => { if (dirty.current) void save(); };
    window.addEventListener("pagehide", flush);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", flush); };
  }, [attempt, result, save]);

  const submit = useCallback(async () => {
    if (!attempt) return;
    setConfirming(false);
    setSubmitting(true);
    try {
      const outcome = await assessmentApi.submit(attempt.attemptId, answersRef.current);
      setResult(outcome);
      onFinished?.(outcome);
    } catch (err) {
      setError(err instanceof AssessmentError ? err : new AssessmentError("Couldn't submit. Your answers are saved; try again.", "ERROR", 0));
    } finally {
      setSubmitting(false);
    }
  }, [attempt, onFinished]);

  // Server-side timer: shown here, enforced by the backend. Announced at 10, 5 and 1 minute left.
  useEffect(() => {
    if (!attempt?.expiresAt || result) { setRemaining(null); return; }
    const expires = Date.parse(attempt.expiresAt);
    const tick = () => {
      const left = expires - (Date.now() + clockOffset.current);
      setRemaining(left);
      for (const minutes of [10, 5, 1]) {
        if (left <= minutes * 60_000 && left > (minutes - 1) * 60_000 && !announced.current.has(minutes)) {
          announced.current.add(minutes);
          setAnnouncement(`${minutes} ${minutes === 1 ? "minute" : "minutes"} left.`);
        }
      }
      if (left <= 0) void submit();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result, submit]);

  const choose = (questionId: number, position: number, multiple: boolean) => {
    setAnswers((prev) => {
      const key = String(questionId);
      const existing = prev[key] ?? [];
      const next = multiple ? (existing.includes(position) ? existing.filter((value) => value !== position) : [...existing, position].sort((a, b) => a - b)) : [position];
      return { ...prev, [key]: next };
    });
    dirty.current = true;
    setSaveState("idle");
  };

  const questions = useMemo(() => attempt?.questions ?? [], [attempt]);
  const answered = (id: number) => (answers[String(id)] ?? []).length > 0;
  const unanswered = questions.map((question, index) => ({ question, index })).filter(({ question }) => !answered(question.id));
  const isExam = attempt?.quiz.kind === "final_exam";
  const isCheck = attempt?.quiz.kind === "knowledge_check";

  if (loading) {
    return <div className="flex items-center justify-center py-10" aria-busy="true"><Spinner size="lg" /></div>;
  }

  if (error && !attempt) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6" role="alert">
        <p className="font-semibold text-neutral-900">
          {error.code === "QUIZ_COOLDOWN" ? "Take a short break" : error.code === "CERTIFICATE_PURCHASE_REQUIRED" ? "Get your certificate first" : error.code === "ALREADY_EXISTS" ? "Already passed" : "This can't start right now"}
        </p>
        <p className="mt-2 text-sm text-neutral-600">{error.code === "QUIZ_COOLDOWN" && error.fields?.opensAt ? `Your next attempt opens ${lagosTime(error.fields.opensAt)}.` : error.message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {error.code === "CERTIFICATE_PURCHASE_REQUIRED" && certificateCheckoutHref && (
            <a href={certificateCheckoutHref} className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800">Get my certificate</a>
          )}
          {onClose && <Button variant="ghost" onClick={onClose}>Back</Button>}
        </div>
      </div>
    );
  }

  if (result && attempt) {
    return (
      <QuizResult
        result={result}
        questions={questions}
        compact={variant === "compact"}
        onRetry={result.passed && !isCheck ? undefined : () => void begin()}
        onClose={onClose}
        onReviewLesson={onReviewLesson}
      />
    );
  }

  if (!attempt) return null;
  const visible = wide || isCheck ? questions.map((question, index) => ({ question, index })) : questions[current] ? [{ question: questions[current], index: current }] : [];
  const timerTone = remaining === null ? "" : remaining < 2 * 60_000 ? "bg-error text-white" : remaining < 10 * 60_000 ? "bg-warning text-neutral-900" : "bg-neutral-900 text-white";

  return (
    <section aria-labelledby={`quiz-${attempt.attemptId}-title`} className={cn("bg-white", variant === "compact" ? "rounded-2xl border border-neutral-200 p-4 sm:p-5" : "")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-3", (isExam || remaining !== null) && "sticky top-0 z-10 -mx-1 bg-white/95 px-1 py-2 backdrop-blur")}>
        <div>
          <h2 id={`quiz-${attempt.attemptId}-title`} className="font-heading text-lg font-bold text-neutral-900">
            {isCheck ? `Quick check: ${questions.length} ${questions.length === 1 ? "question" : "questions"}` : attempt.quiz.title}
          </h2>
          {!isCheck && (
            <p className="text-xs text-neutral-500">
              {questions.length} questions · pass mark {attempt.quiz.passingScore}%{attempt.attemptNumber > 1 ? ` · attempt ${attempt.attemptNumber}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCheck && (
            <span className="text-xs text-neutral-500" aria-live="polite">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "offline" ? "Offline: we'll retry" : ""}
            </span>
          )}
          {remaining !== null && (
            <span className={cn("rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums", timerTone)} aria-label={`Time left ${formatRemaining(remaining)}`}>
              {formatRemaining(remaining)}
            </span>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>

      {/* Progress dots / exam navigator */}
      {!isCheck && questions.length > 1 && (
        <nav aria-label="Questions" className={cn("mt-3 flex flex-wrap gap-1.5", isExam && "rounded-xl bg-neutral-50 p-2")}>
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => {
                setCurrent(index);
                if (wide) document.getElementById(`question-${question.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
              aria-label={`Question ${index + 1}${answered(question.id) ? ", answered" : ", not answered"}${flags.has(question.id) ? ", flagged" : ""}`}
              aria-current={!wide && index === current ? "step" : undefined}
              className={cn(
                "relative flex items-center justify-center rounded-md text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800",
                isExam ? "h-8 w-8" : "h-3 w-3 rounded-full",
                answered(question.id) ? "bg-primary-800 text-white" : "bg-neutral-200 text-neutral-700",
                !wide && index === current && "ring-2 ring-accent-500",
              )}
            >
              {isExam ? index + 1 : null}
              {flags.has(question.id) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent-600" aria-hidden="true" />}
            </button>
          ))}
        </nav>
      )}

      <div className="mt-4 space-y-6">
        {visible.map(({ question, index }) => {
          const multiple = question.type === "multiple";
          const chosen = answers[String(question.id)] ?? [];
          return (
            <fieldset key={question.id} id={`question-${question.id}`} className="scroll-mt-24">
              <legend className="mb-3 font-semibold text-neutral-900">
                <span className="text-neutral-500">{index + 1}.</span> {question.prompt}
                {multiple && <span className="mt-1 block text-xs font-normal text-neutral-500">Choose all that apply.</span>}
              </legend>
              <div className="space-y-2">
                {question.options.map((option, position) => {
                  const selected = chosen.includes(position);
                  return (
                    <label
                      key={position}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                        selected ? "border-primary-800 bg-primary-50 text-neutral-900" : "border-neutral-200 text-neutral-700 hover:border-primary-300",
                      )}
                    >
                      <input
                        type={multiple ? "checkbox" : "radio"}
                        name={`attempt-${attempt.attemptId}-q-${question.id}`}
                        checked={selected}
                        onChange={() => choose(question.id, position, multiple)}
                        className="mt-0.5 h-4 w-4 accent-primary-800"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {isExam && (
                <button
                  type="button"
                  onClick={() => setFlags((prev) => { const next = new Set(prev); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next; })}
                  aria-pressed={flags.has(question.id)}
                  className="mt-2 min-h-10 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  {flags.has(question.id) ? "★ Flagged for review" : "☆ Flag for review"}
                </button>
              )}
            </fieldset>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-error">{error.message}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!wide && !isCheck && questions.length > 1 && (
          <>
            <Button variant="ghost" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}>Previous</Button>
            {current < questions.length - 1 && <Button variant="outline" onClick={() => { void save(); setCurrent((index) => index + 1); }}>Next</Button>}
          </>
        )}
        {(wide || isCheck || current === questions.length - 1) && (
          <Button variant="accent" loading={submitting} onClick={() => (unanswered.length && !isCheck ? setConfirming(true) : void submit())}>
            {isCheck ? "Check my answers" : "Submit"}
          </Button>
        )}
        {isCheck && onClose && (
          <button type="button" onClick={onClose} className="min-h-11 text-sm font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline">
            Skip
          </button>
        )}
      </div>

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} title="Submit now?" size="sm">
        <p className="text-sm text-neutral-700">
          {unanswered.length === 1 ? "1 question isn't answered:" : `${unanswered.length} questions aren't answered:`}{" "}
          {unanswered.slice(0, 20).map(({ index }) => index + 1).join(", ")}
          {unanswered.length > 20 ? "…" : ""}. Unanswered questions count as wrong.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="accent" onClick={() => void submit()} loading={submitting}>Submit anyway</Button>
          <Button variant="ghost" onClick={() => { setConfirming(false); const first = unanswered[0]; if (first) setCurrent(first.index); }}>Keep answering</Button>
        </div>
      </Modal>
    </section>
  );
}

export { timestampSeconds };
