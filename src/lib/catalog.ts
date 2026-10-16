import { backendUrl } from "@/lib/backend-api";
import { schoolOneLiner, site } from "@/content/site";
import { slugify } from "@/lib/utils";

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
 * The ten schools with their paid programmes. Free courses (the CV & LinkedIn and Freelancing
 * bonuses) are not programmes you apply for. A school with no published programme yet has an
 * empty list; pages show it as "Programmes coming soon" and offer a waitlist instead of Apply.
 */
export async function getSchools(): Promise<SchoolSummary[]> {
  // If the catalogue can't be loaded, still show the ten schools (without programmes).
  const [categories, courses] = await Promise.all([
    backendList<BackendCategory>("categories?limit=100&depth=0&sort=name").catch((): BackendCategory[] => []),
    backendList<BackendCourse>("courses?limit=500&depth=1&where[status][equals]=published&sort=title").catch((): BackendCourse[] => []),
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

  // The ten SkillsAir schools always appear, in the owner's order, even before they have
  // programmes. Backend categories supply the real slug and programmes when they exist.
  const byName = new Map(categories.map((category) => [normalise(category.name), category]));
  const tenSchools: SchoolSummary[] = site.schools.map((school) => {
    const category = byName.get(normalise(school.name));
    return {
      slug: category?.slug || slugify(school.name),
      name: school.name,
      oneLiner: school.oneLiner,
      programmes: category ? programmesBySchool.get(category.id) ?? [] : [],
    };
  });
  const known = new Set(site.schools.map((school) => normalise(school.name)));
  const otherSchools = categories
    .filter((category) => !known.has(normalise(category.name)) && (programmesBySchool.get(category.id)?.length ?? 0) > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      oneLiner: schoolOneLiner(category.name),
      programmes: programmesBySchool.get(category.id) ?? [],
    }));
  return [...tenSchools, ...otherSchools];
}
