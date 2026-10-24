import { backendUrl } from "@/lib/backend-api";
import { findSchoolInfo, matchesPlannedProgramme, schoolOneLiner, site, type SchoolInfo } from "@/content/site";
import { slugify } from "@/lib/utils";

/** Public programme summary. Deliberately has no price fields. */
export interface ProgrammeSummary {
  slug: string;
  title: string;
  shortDescription: string;
  phoneFriendly: boolean;
  /** Last edit in the CMS (ISO), for the sitemap's lastmod. */
  updatedAt: string | null;
}

export interface SchoolSummary {
  slug: string;
  name: string;
  oneLiner: string;
  programmes: ProgrammeSummary[];
  /** Programmes in the owner's line-up that aren't published yet ("Coming soon"). */
  upcoming: string[];
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
  updatedAt?: string | null;
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

const relationId = (value: number | BackendCategory | undefined) =>
  typeof value === "object" && value ? value.id : typeof value === "number" ? value : undefined;

/**
 * The ten schools with their paid programmes. Free courses (the CV & LinkedIn and Freelancing
 * bonuses) are not programmes you apply for. A course can sit in more than one school (for
 * example UI/UX in Design and Products); its first category is its home school. Programmes in
 * the owner's line-up that aren't published yet are listed as `upcoming`. A school with no
 * published programme shows "Programmes coming soon" and offers a waitlist instead of Apply.
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
    const programme: ProgrammeSummary = {
      slug: course.slug,
      title: course.title,
      shortDescription: course.shortDescription ?? "",
      phoneFriendly: Boolean(course.phoneFriendly),
      updatedAt: course.updatedAt ?? null,
    };
    const schoolIds = new Set((course.categories ?? []).map(relationId).filter((id): id is number => Boolean(id)));
    for (const schoolId of Array.from(schoolIds)) programmesBySchool.set(schoolId, [...(programmesBySchool.get(schoolId) ?? []), programme]);
  }

  // The ten SkillsAir schools always appear, in the owner's order, even before they have
  // programmes. Backend categories supply the real slug and programmes when they exist.
  const categoryFor = new Map<SchoolInfo, BackendCategory>();
  for (const category of categories) {
    const info = findSchoolInfo(category.name);
    if (info && !categoryFor.has(info)) categoryFor.set(info, category);
  }
  const tenSchools: SchoolSummary[] = (site.schools as readonly SchoolInfo[]).map((school) => {
    const category = categoryFor.get(school);
    const programmes = category ? programmesBySchool.get(category.id) ?? [] : [];
    return {
      slug: category?.slug || slugify(school.name),
      name: school.name,
      oneLiner: school.oneLiner,
      programmes,
      upcoming: school.programmes
        .filter((planned) => !programmes.some((programme) => matchesPlannedProgramme(programme.title, planned)))
        .map((planned) => planned.title),
    };
  });

  // Older backend categories only appear if they hold programmes that none of the ten schools has.
  const listed = new Set(tenSchools.flatMap((school) => school.programmes.map((programme) => programme.slug)));
  const otherSchools = categories
    .filter((category) => !findSchoolInfo(category.name))
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      oneLiner: schoolOneLiner(category.name),
      programmes: (programmesBySchool.get(category.id) ?? []).filter((programme) => !listed.has(programme.slug)),
      upcoming: [],
    }))
    .filter((school) => school.programmes.length > 0);
  return [...tenSchools, ...otherSchools];
}
