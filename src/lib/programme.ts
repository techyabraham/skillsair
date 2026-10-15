import { backendUrl } from "@/lib/backend-api";
import { mapBackendCourse, toPublicCourse } from "@/lib/backend-course-mapper";
import type { Course } from "@/types/course";

export interface ProgrammeDetail {
  course: Course;
  phoneFriendly: boolean;
  durationMonths: number;
  weeklyHours: number;
  school: { name: string; slug: string } | null;
  projects: string[];
  whoFor: string[];
  previewLessonId: number | null;
}

interface RawCourse {
  id?: number;
  phoneFriendly?: boolean | null;
  durationMonths?: number | null;
  weeklyHours?: number | null;
  categories?: Array<number | { name?: string; slug?: string }> | null;
  objectives?: Array<{ objective?: string }> | null;
}

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
  const projects = [
    ...course.outcomes.filter((outcome) => /\bproject/i.test(outcome)),
    ...descriptionSentences.filter((sentence) => /\b(you will|you'll) (build|create|complete)\b.*\bproject/i.test(sentence)),
  ];
  const whoFor = descriptionSentences.filter((sentence) => /(who (this|it) is for|ideal for|perfect for|designed for|is for you if|not for you)/i.test(sentence));
  const previewLesson = course.curriculum.flatMap((section) => section.lessons).find((lesson) => lesson.isPreview);

  return {
    status: "ok",
    programme: {
      course,
      phoneFriendly: Boolean(raw.phoneFriendly),
      durationMonths: raw.durationMonths ?? 3,
      weeklyHours: raw.weeklyHours ?? 8,
      school: firstCategory?.name && firstCategory.slug ? { name: firstCategory.name, slug: firstCategory.slug } : null,
      projects: Array.from(new Set(projects)).slice(0, 6),
      whoFor: whoFor.slice(0, 4),
      previewLessonId: previewLesson?.id ?? null,
    },
  };
}
