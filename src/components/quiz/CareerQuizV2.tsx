"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTEXT_QUESTIONS,
  QUIZ_VERSION,
  careers,
  coreQuestions,
  scoreCareers,
  shuffleWithSeed,
  tieBreakerPair,
  type CareerId,
  type QuizAnswers,
  type QuizContext,
} from "@/content/quiz-v2";
import { LeadDetailsForm } from "@/components/apply/LeadDetailsForm";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sa_quiz_v2";

interface QuizState {
  /** Seeds the answer order, so Back (or a reload) never reshuffles. */
  seed: string;
  step: number;
  answers: QuizAnswers;
  context: Partial<QuizContext>;
  tieBreaker: CareerId | null;
}

type Screen =
  | { kind: "core"; index: number }
  | { kind: "tie"; pair: [CareerId, CareerId] }
  | { kind: "context"; index: number }
  | { kind: "gate" };

function newState(): QuizState {
  return { seed: Math.random().toString(36).slice(2, 10), step: 0, answers: {}, context: {}, tieBreaker: null };
}

function loadState(): QuizState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    if (typeof parsed.seed !== "string" || typeof parsed.step !== "number") return null;
    return { seed: parsed.seed, step: parsed.step, answers: parsed.answers ?? {}, context: parsed.context ?? {}, tieBreaker: parsed.tieBreaker ?? null };
  } catch {
    return null;
  }
}

function saveState(state: QuizState | null): void {
  try {
    if (state) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage disabled: the quiz still works, it just won't survive a reload.
  }
}

/** The screens in order. The tie-breaker appears only when the top two careers are close. */
function screensFor(answers: QuizAnswers): Screen[] {
  const screens: Screen[] = coreQuestions.map((_, index) => ({ kind: "core", index }));
  const coreDone = coreQuestions.every((question) => answers[question.id]);
  const pair = coreDone ? tieBreakerPair(scoreCareers(answers)) : null;
  if (pair) screens.push({ kind: "tie", pair });
  CONTEXT_QUESTIONS.forEach((_, index) => screens.push({ kind: "context", index }));
  screens.push({ kind: "gate" });
  return screens;
}

const optionClass = (selected: boolean) =>
  cn(
    "flex min-h-14 w-full items-center rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 focus-visible:ring-offset-2",
    selected ? "border-navy bg-primary-50 text-navy" : "border-neutral-200 text-neutral-800 hover:border-neutral-400",
  );

export function CareerQuizV2({ retake = false }: { retake?: boolean }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<QuizState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const saved = retake ? null : loadState();
    setState(saved ?? newState());
    if (!saved) track("quiz_start", { version: QUIZ_VERSION });
  }, [retake]);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const screens = useMemo(() => (state ? screensFor(state.answers) : []), [state]);
  const step = state ? Math.min(state.step, screens.length - 1) : 0;
  const screen = screens[step];

  const screenKey = screen ? (screen.kind === "core" ? coreQuestions[screen.index]!.id : screen.kind === "context" ? CONTEXT_QUESTIONS[screen.index]!.id : screen.kind) : "";
  useEffect(() => {
    if (!screenKey) return;
    headingRef.current?.focus({ preventScroll: true });
    if (screenKey === "tie") track("quiz_tiebreaker_view", {});
    else if (screenKey !== "gate") track("quiz_question_view", { question: screenKey, index: step + 1 });
  }, [screenKey, step]);

  if (!state || !screen) {
    return <div className="h-80 animate-pulse rounded-2xl bg-neutral-200" aria-busy="true" aria-label="Loading the quiz" />;
  }

  const questionScreens = screens.length - 1; // the gate isn't a question
  // Starts partly filled (it's quick, and a head start helps people keep going).
  const progress = Math.round(8 + (92 * Math.min(step, questionScreens)) / questionScreens);
  const next = (patch: Partial<QuizState>) => setState((current) => (current ? { ...current, ...patch, step: current.step + 1 } : current));
  const back = () => setState((current) => (current ? { ...current, step: Math.max(0, current.step - 1) } : current));

  const header = (label: string, question: string) => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
          <span>{label}</span>
          {screen.kind !== "gate" && <span>{progress}%</span>}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-navy transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-heading font-bold leading-snug text-neutral-900 focus:outline-none md:text-2xl">
        {question}
      </h2>
    </>
  );

  const backButton =
    step > 0 ? (
      <button type="button" onClick={back} className="mt-6 min-h-12 text-sm font-medium text-neutral-600 hover:text-neutral-900">
        ← Back
      </button>
    ) : null;

  if (screen.kind === "core") {
    const question = coreQuestions[screen.index]!;
    const options = shuffleWithSeed(question.options, `${state.seed}:${question.id}`);
    return (
      <section aria-labelledby="quiz-q">
        {header(`Question ${step + 1} of ${questionScreens}`, question.question)}
        <div id="quiz-q" className="sr-only">{question.question}</div>
        <div className="mt-5 grid gap-3" role="group" aria-label={question.question}>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={state.answers[question.id] === option.id}
              className={optionClass(state.answers[question.id] === option.id)}
              onClick={() => {
                track("quiz_question_answer", { question: question.id, option: option.id, index: step + 1 });
                // A changed core answer can change the tie-breaker pair, so clear the old pick.
                next({ answers: { ...state.answers, [question.id]: option.id }, tieBreaker: state.answers[question.id] === option.id ? state.tieBreaker : null });
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {backButton}
      </section>
    );
  }

  if (screen.kind === "tie") {
    const options = shuffleWithSeed(screen.pair, `${state.seed}:tie`);
    return (
      <section aria-labelledby="quiz-tie">
        {header("One more, it's close!", "Which sounds more like you?")}
        <p id="quiz-tie" className="mt-2 text-neutral-600">Your top two matches are neck and neck. Pick the typical day you&apos;d enjoy more.</p>
        <div className="mt-5 grid gap-3" role="group" aria-label="Which sounds more like you?">
          {options.map((career) => (
            <button
              key={career}
              type="button"
              aria-pressed={state.tieBreaker === career}
              className={optionClass(state.tieBreaker === career)}
              onClick={() => {
                track("quiz_question_answer", { question: "tiebreaker", option: career, index: step + 1 });
                next({ tieBreaker: career });
              }}
            >
              {careers[career].day}
            </button>
          ))}
        </div>
        {backButton}
      </section>
    );
  }

  if (screen.kind === "context") {
    const question = CONTEXT_QUESTIONS[screen.index]!;
    return (
      <section aria-labelledby="quiz-ctx">
        {header(`Question ${step + 1} of ${questionScreens}`, question.question)}
        <p id="quiz-ctx" className="mt-2 text-sm text-neutral-600">This doesn&apos;t change your match. It helps us show what will work for you.</p>
        <div className="mt-5 grid gap-3" role="group" aria-label={question.question}>
          {question.options.map((option) => {
            const selected = state.context[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                className={optionClass(selected)}
                onClick={() => {
                  track("quiz_question_answer", { question: question.id, option: option.id, index: step + 1 });
                  next({ context: { ...state.context, [question.id]: option.id } });
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {backButton}
      </section>
    );
  }

  // Gate: the same details form (and lead) as Apply step 2.
  const context = state.context as QuizContext;
  return (
    <section aria-labelledby="quiz-gate">
      {header("Done!", "Your match is ready! Where should we send your results and your scholarship offer?")}
      <div id="quiz-gate" className="sr-only">Your match is ready</div>
      <div className="mt-6">
        <LeadDetailsForm
          source="quiz"
          submitLabel="Show my match →"
          initial={user ? { firstName: user.firstName || undefined, email: user.email || undefined, phone: user.phone || undefined } : undefined}
          extra={{ quiz: { version: QUIZ_VERSION, answers: state.answers, context, tieBreaker: state.tieBreaker } }}
          onSuccess={(result) => {
            track("lead_captured", { source: "quiz" });
            if (!result.resultId) return;
            track("quiz_complete", { version: QUIZ_VERSION });
            saveState(null);
            router.push(`/quiz/result/${encodeURIComponent(result.resultId)}`);
          }}
        />
      </div>
      {backButton}
    </section>
  );
}
