import { backendUrl } from "@/lib/backend-api";
import { mapBackendCourse, toPublicCourse } from "@/lib/backend-course-mapper";
import type { Course } from "@/types/course";
import { findSchoolInfo } from "@/content/site";

/** The long description as plain blocks (no HTML), so headings stay headings on the page. */
export type DescriptionBlock = { type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "list"; items: string[] };

export interface ProgrammeDetail {
  course: Course;
  phoneFriendly: boolean;
  durationMonths: number;
  weeklyHours: number;
  school: { name: string; slug: string } | null;
  projects: string[];
  whoFor: string[];
  previewLessonId: number | null;
  about: DescriptionBlock[];
  tools: string[];
  careerPaths: string[];
  /** Programme-specific questions (also published as FAQPage structured data). */
  faq: Array<{ question: string; answer: string }>;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string | null;
}

interface RawCourse {
  id?: number;
  phoneFriendly?: boolean | null;
  durationMonths?: number | null;
  weeklyHours?: number | null;
  categories?: Array<number | { name?: string; slug?: string }> | null;
  objectives?: Array<{ objective?: string }> | null;
  whoItsFor?: Array<{ item?: string | null }> | null;
  toolsCovered?: Array<{ tool?: string | null }> | null;
  careerPaths?: Array<{ role?: string | null }> | null;
  faq?: Array<{ question?: string | null; answer?: string | null }> | null;
  meta?: { title?: string | null; description?: string | null } | null;
  updatedAt?: string | null;
}

function inlineText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const current = node as { text?: unknown; children?: unknown[]; type?: string };
  if (typeof current.text === "string") return current.text;
  if (current.type === "linebreak") return " ";
  return Array.isArray(current.children) ? current.children.map(inlineText).join("") : "";
}

function descriptionBlocks(value: unknown): DescriptionBlock[] {
  if (typeof value === "string") {
    return value
      .replace(/<[^>]+>/g, " ")
      .split(/\n\s*\n/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((text) => ({ type: "paragraph" as const, text }));
  }
  const root = (value as { root?: { children?: unknown[] } } | null)?.root;
  const blocks: DescriptionBlock[] = [];
  for (const node of root?.children ?? []) {
    const current = node as { type?: string; children?: unknown[] };
    if (current.type === "heading") {
      const text = inlineText(current).trim();
      if (text) blocks.push({ type: "heading", text });
    } else if (current.type === "list") {
      const listItems = (current.children ?? []).map((child) => inlineText(child).trim()).filter(Boolean);
      if (listItems.length) blocks.push({ type: "list", items: listItems });
    } else {
      const text = inlineText(current).replace(/\s+/g, " ").trim();
      if (text) blocks.push({ type: "paragraph", text });
    }
  }
  return blocks;
}

const items = <T,>(rows: T[] | null | undefined, pick: (row: T) => string | null | undefined): string[] =>
  (rows ?? []).map((row) => (pick(row) ?? "").trim()).filter(Boolean);

const fetchOptions = {
  headers: { Accept: "application/json", "User-Agent": "SkillsAir-Frontend/1.0" },
  next: { revalidate: 300 },
};

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

export type ProgrammeResult = { status: "ok"; programme: ProgrammeDetail } | { status: "missing" } | { status: "unavailable" };

/**
 * Published programme details for the public page (no price fields). Curriculum loads
 * separately so a missing curriculum never turns into a false "not found".
 */
export async function getProgramme(slug: string): Promise<ProgrammeResult> {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return { status: "missing" };
  let raw: (RawCourse & Record<string, unknown>) | undefined;
  try {
    const query = new URLSearchParams({ limit: "1", depth: "2", "where[slug][equals]": slug, "where[status][equals]": "published" });
    const response = await fetch(backendUrl(`courses?${query}`), fetchOptions);
    if (!response.ok) return { status: "unavailable" };
    raw = ((await response.json()) as { docs?: Array<RawCourse & Record<string, unknown>> }).docs?.[0];
  } catch {
    return { status: "unavailable" };
  }
  if (!raw?.id) return { status: "missing" };

  let sections: unknown[] = [];
  try {
    const curriculum = await fetch(backendUrl(`courses/${raw.id}/curriculum`), fetchOptions);
    if (curriculum.ok) {
      const payload = (await curriculum.json()) as { data?: { sections?: unknown[] }; sections?: unknown[] };
      sections = payload.data?.sections ?? payload.sections ?? [];
    }
  } catch {
    sections = [];
  }

  const course = toPublicCourse(mapBackendCourse({ ...raw, sections }));
  const firstCategory = raw.categories?.find((item): item is { name?: string; slug?: string } => typeof item === "object" && item !== null);
  const descriptionSentences = sentences(course.description);
  // Only from the description: objectives are already shown under "What you'll be able to do".
  const projects = descriptionSentences.filter(
    (sentence) => /\bprojects?\b/i.test(sentence) && /\b(build|create|complete|make|design|launch)\b/i.test(sentence),
  );
  const whoForCopy = items(raw.whoItsFor, (row) => row.item);
  const whoFor = whoForCopy.length ? whoForCopy : descriptionSentences.filter((sentence) => /(who (this|it) is for|ideal for|perfect for|designed for|is for you if|not for you)/i.test(sentence));
  const previewLesson = course.curriculum.flatMap((section) => section.lessons).find((lesson) => lesson.isPreview);

  return {
    status: "ok",
    programme: {
      course,
      phoneFriendly: Boolean(raw.phoneFriendly),
      durationMonths: raw.durationMonths ?? 3,
      weeklyHours: raw.weeklyHours ?? 8,
      school: firstCategory?.name && firstCategory.slug ? { name: findSchoolInfo(firstCategory.name)?.name ?? firstCategory.name, slug: firstCategory.slug } : null,
      projects: Array.from(new Set(projects)).slice(0, 6),
      whoFor: whoFor.slice(0, 4),
      previewLessonId: previewLesson?.id ?? null,
      about: descriptionBlocks(raw.description),
      tools: items(raw.toolsCovered, (row) => row.tool),
      careerPaths: items(raw.careerPaths, (row) => row.role),
      faq: (raw.faq ?? [])
        .map((row) => ({ question: (row.question ?? "").trim(), answer: (row.answer ?? "").trim() }))
        .filter((row) => row.question && row.answer),
      metaTitle: raw.meta?.title?.trim() || null,
      metaDescription: raw.meta?.description?.trim() || null,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    },
  };
}
