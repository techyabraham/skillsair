import { backendUrl, serverBackendFetch } from "@/lib/backend-api";
import {
  CAREER_IDS,
  TRAIT_IDS,
  careerStatus,
  careers,
  isCareerId,
  matchLabel,
  validateAnswers,
  whyLine,
  type CareerId,
  type CareerStatus,
  type MatchLabel,
  type QuizContext,
  type TraitId,
} from "@/content/quiz-v2";

/** A saved result as the backend returns it (first name only, no contact details). */
export interface SavedQuizResult {
  publicId: string;
  quizVersion: string;
  firstName: string;
  topMatch: string | null;
  answers: Record<string, string>;
  tieBreaker: string | null;
  scores: Array<{ career: string; percent: number }>;
  traits: Record<string, number>;
  context: Partial<QuizContext>;
  welcomeBack: boolean;
  waitlisted: string[];
  createdAt: string;
}

/** Published programme facts used on the result page (from the course record, not QSM). */
export interface ProgrammeFacts {
  slug: string;
  title: string;
  phoneFriendly: boolean;
  durationMonths: number | null;
  weeklyHours: number | null;
}

const PUBLIC_ID = /^[A-Za-z0-9_-]{16,32}$/;

export type QuizResultLookup = { status: "ok"; result: SavedQuizResult } | { status: "not_found" } | { status: "error" };

export async function getQuizResult(publicId: string, requestHeaders?: Headers, cacheSeconds?: number): Promise<QuizResultLookup> {
  if (!PUBLIC_ID.test(publicId)) return { status: "not_found" };
  try {
    const response = await serverBackendFetch(`quiz-results/public/${encodeURIComponent(publicId)}`, {
      requestHeaders,
      init: cacheSeconds ? { cache: undefined, next: { revalidate: cacheSeconds } } : {},
    });
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };
    const payload = (await response.json()) as { data?: SavedQuizResult };
    return payload.data ? { status: "ok", result: payload.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

interface BackendCourse {
  slug?: string;
  title?: string;
  isBonus?: boolean | null;
  phoneFriendly?: boolean | null;
  durationMonths?: number | null;
  weeklyHours?: number | null;
}

/** Published, non-bonus programmes by slug. Throws if the catalogue can't be loaded. */
export async function getPublishedProgrammes(): Promise<Map<string, ProgrammeFacts>> {
  const response = await fetch(backendUrl("courses?limit=500&depth=0&where[status][equals]=published"), {
    headers: { Accept: "application/json", "User-Agent": "SkillsAir-Frontend/1.0" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Catalogue request failed (${response.status})`);
  const payload = (await response.json()) as { docs?: BackendCourse[] };
  const map = new Map<string, ProgrammeFacts>();
  for (const course of payload.docs ?? []) {
    if (!course.slug || !course.title || course.isBonus) continue;
    map.set(course.slug, {
      slug: course.slug,
      title: course.title,
      phoneFriendly: Boolean(course.phoneFriendly),
      durationMonths: typeof course.durationMonths === "number" ? course.durationMonths : null,
      weeklyHours: typeof course.weeklyHours === "number" ? course.weeklyHours : null,
    });
  }
  return map;
}

export interface CareerRow {
  career: CareerId;
  name: string;
  percent: number;
  label: MatchLabel;
  status: CareerStatus;
  programme: ProgrammeFacts | null;
}

export interface ResultView {
  publicId: string;
  firstName: string;
  welcomeBack: boolean;
  rows: CareerRow[];
  top: CareerRow;
  top3: CareerRow[];
  /** The highest-ranked open career (the orange Apply button), if any is open. */
  bestOpen: CareerRow | null;
  why: string | null;
  traits: Record<TraitId, number>;
  context: Partial<QuizContext>;
  waitlisted: CareerId[];
  /** True when the top score is under 60%: show the top three equally. */
  fewOptions: boolean;
}

/** Turns a saved result plus the live catalogue into what the page shows. Status is live. */
export function buildResultView(result: SavedQuizResult, programmes: Map<string, ProgrammeFacts>): ResultView | null {
  const published = new Set(programmes.keys());
  const seen = new Set<string>();
  const rows: CareerRow[] = [];
  for (const score of result.scores) {
    if (!isCareerId(score.career) || seen.has(score.career)) continue;
    seen.add(score.career);
    const status = careerStatus(score.career, published);
    const slug = careers[score.career].programmeSlug;
    const percent = Math.max(0, Math.min(100, Math.round(Number(score.percent) || 0)));
    rows.push({ career: score.career, name: careers[score.career].name, percent, label: matchLabel(percent), status, programme: status === "open" && slug ? programmes.get(slug) ?? null : null });
  }
  if (rows.length !== CAREER_IDS.length || !rows[0]) return null;
  const answers = validateAnswers(result.answers);
  const traits = Object.fromEntries(TRAIT_IDS.map((id) => [id, Math.max(0, Math.min(100, Math.round(Number(result.traits[id]) || 0)))])) as Record<TraitId, number>;
  return {
    publicId: result.publicId,
    firstName: result.firstName.trim().split(/\s+/)[0] ?? "",
    welcomeBack: result.welcomeBack,
    rows,
    top: rows[0],
    top3: rows.slice(0, 3),
    bestOpen: rows.find((row) => row.status === "open") ?? null,
    why: answers.ok ? whyLine(answers.value, rows[0].career) : null,
    traits,
    context: result.context,
    waitlisted: result.waitlisted.filter(isCareerId),
    fewOptions: rows[0].percent < 60,
  };
}
