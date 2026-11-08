import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAREER_IDS,
  CONTEXT_QUESTIONS,
  QSM_WEIGHT_CHANGES,
  QUIZ_TAPS,
  TIE_BREAKER_BONUS,
  careerStatus,
  careers,
  coreQuestions,
  effectiveWeights,
  scoreCareers,
  scoreQuiz,
  shuffleWithSeed,
  tieBreakerPair,
  topOpenMatch,
  validateAnswers,
  validateContext,
  whyLine,
  type CareerId,
  type QuizAnswers,
} from "./quiz-v2";
import { qsmQuestions } from "./quiz-qsm.generated";

function rng(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function randomAnswers(random: () => number): QuizAnswers {
  return Object.fromEntries(coreQuestions.map((question) => [question.id, question.options[Math.floor(random() * question.options.length)]!.id]));
}

/** Every programme slug in quiz-v2 counted as published (today's live catalogue). */
const allLinked = new Set(CAREER_IDS.map((id) => careers[id].programmeSlug).filter((slug): slug is string => Boolean(slug)));

describe("question set", () => {
  it("has 12 core questions (11 kept from QSM + 1 new) and 3 context questions", () => {
    expect(coreQuestions).toHaveLength(12);
    expect(CONTEXT_QUESTIONS).toHaveLength(3);
    expect(QUIZ_TAPS).toBe(15);
    expect(coreQuestions.filter((question) => question.qsmId).map((question) => question.qsmId)).toEqual([9, 19, 14, 18, 6, 7, 11, 10, 17, 3, 13]);
  });

  it("keeps QSM weights except the documented rebalancing edits", () => {
    const source = new Map(qsmQuestions.map((question) => [question.qsmId, question]));
    for (const question of coreQuestions) {
      if (!question.qsmId) continue;
      const original = source.get(question.qsmId)!;
      question.options.filter((option) => option.qsm).forEach((option) => {
        const index = option.id.split("-")[1]!.charCodeAt(0) - 97;
        const expected: Record<string, number> = { ...original.answers[index]!.weights };
        for (const [career, [from, to]] of Object.entries(QSM_WEIGHT_CHANGES[option.id] ?? {}) as Array<[string, [number, number]]>) {
          expect(expected[career] ?? 0, `${option.id} ${career} original`).toBe(from);
          if (to) expected[career] = to;
          else delete expected[career];
        }
        expect(option.weights, option.id).toEqual(expected);
      });
    }
  });

  it("uses 0–3 points per answer and 1–2 traits per answer", () => {
    for (const question of coreQuestions) {
      for (const option of question.options) {
        for (const points of Object.values(effectiveWeights(option))) {
          expect(points).toBeGreaterThanOrEqual(0);
          expect(points).toBeLessThanOrEqual(3);
        }
        expect(option.traits.length).toBeGreaterThanOrEqual(1);
        expect(option.traits.length).toBeLessThanOrEqual(2);
      }
      expect(new Set(question.options.map((option) => option.id)).size).toBe(question.options.length);
    }
  });

  it("gives Cloud Engineering options in QSM questions 6, 10 and 18", () => {
    for (const id of ["q6", "q10", "q18"]) {
      const question = coreQuestions.find((item) => item.id === id)!;
      expect(question.options.some((option) => !option.qsm && option.weights.cloud === 3)).toBe(true);
    }
  });
});

describe("scoring", () => {
  it("every one of the 14 careers can be the top match", () => {
    for (const career of CAREER_IDS) {
      // Greedy: per question, the answer with most points for this career and fewest for the rest.
      const answers: QuizAnswers = {};
      for (const question of coreQuestions) {
        const best = [...question.options].sort((a, b) => {
          const wa = effectiveWeights(a);
          const wb = effectiveWeights(b);
          const others = (w: typeof wa) => Object.entries(w).reduce((sum, [id, points]) => (id === career ? sum : sum + (points ?? 0)), 0);
          return (wb[career] ?? 0) - (wa[career] ?? 0) || others(wa) - others(wb);
        })[0]!;
        answers[question.id] = best.id;
      }
      let result = scoreQuiz(answers, career);
      if (result.topMatch !== career) {
        // Fall back to a random search.
        const random = rng(career.length * 97);
        for (let attempt = 0; attempt < 50_000 && result.topMatch !== career; attempt += 1) result = scoreQuiz(randomAnswers(random), career);
      }
      expect(result.topMatch, career).toBe(career);
    }
  });

  it("is balanced across 5,000 random answer sets", () => {
    const random = rng(2026);
    const counts = Object.fromEntries(CAREER_IDS.map((id) => [id, 0])) as Record<CareerId, number>;
    let waitlistTop = 0;
    let tieBreakers = 0;
    const runs = 5000;
    for (let run = 0; run < runs; run += 1) {
      const answers = randomAnswers(random);
      const pair = tieBreakerPair(scoreCareers(answers));
      if (pair) tieBreakers += 1;
      const result = scoreQuiz(answers, pair ? pair[random() < 0.5 ? 0 : 1] : null);
      counts[result.topMatch] += 1;
      if (careerStatus(result.topMatch, allLinked) === "waitlist") waitlistTop += 1;
    }
    const values = Object.values(counts);
    const ratio = Math.max(...values) / Math.min(...values);
    console.log("\nTop-match distribution over 5,000 random answer sets:");
    for (const id of [...CAREER_IDS].sort((a, b) => counts[b] - counts[a])) {
      console.log(`  ${careers[id].name.padEnd(36)} ${String(counts[id]).padStart(4)}  ${((counts[id] / runs) * 100).toFixed(1)}%  ${careerStatus(id, allLinked)}`);
    }
    console.log(`  max/min ratio ${ratio.toFixed(2)} · waitlist top match ${((waitlistTop / runs) * 100).toFixed(1)}% · tie-breaker asked ${((tieBreakers / runs) * 100).toFixed(1)}%`);
    expect(Math.min(...values)).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(2.5);
  });

  it("is deterministic for a given answer set", () => {
    const random = rng(7);
    for (let run = 0; run < 50; run += 1) {
      const answers = randomAnswers(random);
      expect(scoreQuiz(answers, "cloud")).toEqual(scoreQuiz({ ...answers }, "cloud"));
    }
  });

  it("never exceeds 100%, even with the tie-breaker bonus", () => {
    const random = rng(11);
    for (let run = 0; run < 2000; run += 1) {
      const answers = randomAnswers(random);
      const pair = tieBreakerPair(scoreCareers(answers));
      for (const score of scoreQuiz(answers, pair?.[1]).scores) {
        expect(score.percent).toBeLessThanOrEqual(100);
        expect(score.percent).toBeGreaterThanOrEqual(0);
      }
    }
    for (const career of CAREER_IDS) {
      const best: QuizAnswers = Object.fromEntries(
        coreQuestions.map((question) => [question.id, [...question.options].sort((a, b) => (effectiveWeights(b)[career] ?? 0) - (effectiveWeights(a)[career] ?? 0))[0]!.id]),
      );
      expect(scoreCareers(best).find((score) => score.career === career)!.percent).toBe(100);
    }
  });

  it("applies the tie-breaker only to a close top two, and only to one of them", () => {
    const random = rng(5);
    let checked = 0;
    for (let run = 0; run < 500 && checked < 20; run += 1) {
      const answers = randomAnswers(random);
      const raw = scoreCareers(answers);
      const pair = tieBreakerPair(raw);
      if (!pair) {
        expect(scoreQuiz(answers, raw[1]!.career).tieBreaker).toBeNull();
        continue;
      }
      checked += 1;
      const result = scoreQuiz(answers, pair[1]);
      expect(result.tieBreaker?.winner).toBe(pair[1]);
      const before = raw.find((score) => score.career === pair[1])!.exact;
      expect(result.scores.find((score) => score.career === pair[1])!.exact).toBeCloseTo(Math.min(100, before + TIE_BREAKER_BONUS));
      expect(scoreQuiz(answers, "not-a-career").tieBreaker).toBeNull();
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("explains the top match from the answers", () => {
    const answers = randomAnswers(rng(3));
    const result = scoreQuiz(answers);
    expect(whyLine(answers, result.topMatch)).toMatch(/^You said you .+\.$/);
  });
});

describe("open / waitlist status", () => {
  it("a career with no slug is waitlist, even if a similar course is published", () => {
    expect(careers["content-creation"].programmeSlug).toBeUndefined();
    expect(careerStatus("content-creation", new Set(["content-creation", "smart-phone-videography", ...Array.from(allLinked)]))).toBe("waitlist");
  });

  it("links Ethical Hacking and Frontend to their own published programmes", () => {
    expect(careerStatus("ethical-hacking", new Set(["ethical-hacking"]))).toBe("open");
    expect(careerStatus("frontend", new Set(["frontend-development"]))).toBe("open");
    expect(careerStatus("frontend", new Set(["website-development-full-stack"]))).toBe("waitlist");
  });

  it("an unpublished course is waitlist; a published course is open", () => {
    expect(careerStatus("cloud", new Set())).toBe("waitlist");
    expect(careerStatus("cloud", new Set(["cloud-engineering"]))).toBe("open");
  });

  it("finds the best open career below waitlist ones", () => {
    const scores = scoreCareers(randomAnswers(rng(9)));
    const open = topOpenMatch(scores, new Set(["data-analysis"]));
    expect(open?.career).toBe("data-analysis");
    expect(topOpenMatch(scores, new Set())).toBeNull();
  });
});

describe("validation", () => {
  const valid = randomAnswers(rng(1));
  it("accepts a full answer set and rejects unknown or missing answers", () => {
    expect(validateAnswers(valid)).toEqual({ ok: true, value: valid });
    expect(validateAnswers({ ...valid, q9: "q9-z" }).ok).toBe(false);
    expect(validateAnswers({ ...valid, extra: "x" }).ok).toBe(false);
    const missing = { ...valid };
    delete missing.q9;
    expect(validateAnswers(missing).ok).toBe(false);
    expect(validateAnswers(null).ok).toBe(false);
  });

  it("validates the context answers", () => {
    expect(validateContext({ currentStatus: "student", device: "phone_only", weeklyHours: "5_8" }).ok).toBe(true);
    expect(validateContext({ currentStatus: "student", device: "tablet", weeklyHours: "5_8" }).ok).toBe(false);
  });
});

describe("answer order", () => {
  it("shuffles deterministically per seed", () => {
    const options = coreQuestions[0]!.options.map((option) => option.id);
    expect(shuffleWithSeed(options, "abc:q9")).toEqual(shuffleWithSeed(options, "abc:q9"));
    expect([...shuffleWithSeed(options, "abc:q9")].sort()).toEqual([...options].sort());
  });
});

describe("backend copy", () => {
  const backendCopy = resolve(__dirname, "../../../skillsair-backend/src/content/career-quiz.ts");
  it.skipIf(!existsSync(backendCopy))("matches skillsair-backend/src/content/career-quiz.ts (run scripts/sync-quiz-to-backend.ts)", () => {
    const strip = (text: string) => text.replace(/\r\n/g, "\n").replace(/^\/\/ SYNCED[^\n]*\n/, "");
    expect(strip(readFileSync(backendCopy, "utf8"))).toBe(strip(readFileSync(resolve(__dirname, "quiz-v2.ts"), "utf8")));
  });
});
