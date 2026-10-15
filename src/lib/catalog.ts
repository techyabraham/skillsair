import { backendUrl } from "@/lib/backend-api";
import { schoolOneLiner, site } from "@/content/site";

/** Public programme summary. Deliberately has no price fields. */
export interface ProgrammeSummary {
  slug: string;
  title: string;
  shortDescription: string;
  phoneFriendly: boolean;
}

export interface SchoolSummary {
  slug: string;
  name: string;
  oneLiner: string;
  programmes: ProgrammeSummary[];
}

interface BackendCategory {
  id: number;
  name: string;
  slug: string;
}

interface BackendCourse {
  slug?: string;
  title?: string;
  shortDescription?: string | null;
  price?: number;
  phoneFriendly?: boolean | null;
  categories?: Array<number | BackendCategory> | null;
}

async function backendList<T>(path: string): Promise<T[]> {
  const response = await fetch(backendUrl(path), {
    headers: { Accept: "application/json", "User-Agent": "SkillsAir-Frontend/1.0" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
  const payload = (await response.json()) as { docs?: T[] };
  return payload.docs ?? [];
}

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

/**
 * Schools (backend categories) with their paid programmes, in the brief's order. Free courses
 * (the CV & LinkedIn and Freelancing bonuses) are not programmes you apply for. Schools with
 * no published programme yet are left out so nobody applies to an empty school.
 */
export async function getSchools(): Promise<SchoolSummary[]> {
  const [categories, courses] = await Promise.all([
    backendList<BackendCategory>("categories?limit=100&depth=0&sort=name"),
    backendList<BackendCourse>("courses?limit=500&depth=1&where[status][equals]=published&sort=title"),
  ]);

  const programmesBySchool = new Map<number, ProgrammeSummary[]>();
  for (const course of courses) {
    if (!course.slug || !course.title || !(Number(course.price) > 0)) continue;
    const first = course.categories?.[0];
    const schoolId = typeof first === "object" && first ? first.id : typeof first === "number" ? first : undefined;
    if (!schoolId) continue;
    const list = programmesBySchool.get(schoolId) ?? [];
    list.push({
      slug: course.slug,
      title: course.title,
      shortDescription: course.shortDescription ?? "",
      phoneFriendly: Boolean(course.phoneFriendly),
    });
    programmesBySchool.set(schoolId, list);
  }

  const order = site.schools.map((school) => normalise(school.name));
  return categories
    .filter((category) => (programmesBySchool.get(category.id)?.length ?? 0) > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      oneLiner: schoolOneLiner(category.name),
      programmes: programmesBySchool.get(category.id) ?? [],
    }))
    .sort((a, b) => {
      const ai = order.indexOf(normalise(a.name));
      const bi = order.indexOf(normalise(b.name));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}
