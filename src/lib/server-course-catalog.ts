import type { Course, CourseCategory } from "@/types/course";

const WP_BASE = (process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json").replace(/\/$/, "");
const WC_API = `${WP_BASE}/wc/v3`;
const TUTOR_API = process.env.NEXT_PUBLIC_TUTOR_API || `${WP_BASE}/tutor/v1`;

const WC_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET || "";
const TUTOR_API_KEY = process.env.TUTOR_API_KEY || process.env.TUTOR_CLIENT_ID || "";
const TUTOR_API_SECRET = process.env.TUTOR_API_SECRET || process.env.TUTOR_SECRET_KEY || "";

const COURSE_SLUG_ALIASES: Record<string, string> = {
  cybersecurity: "cyber-security",
  "cloud-engineering": "cloud-engineering-aws-solutions-architect",
  "smart-phone-videography": "mobile-videography",
  uiux: "ui-ux",
  "web-development": "website-development-full-stack",
  "web-develoment": "website-development-full-stack",
  "website-development": "website-development-full-stack",
};

const HIDDEN_PRODUCT_SLUGS = new Set([
  "course-certificate",
  "course-certificate-2",
  "website-development",
]);

type JsonRecord = Record<string, unknown>;

export interface WcProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  average_rating: string;
  rating_count: number;
  total_sales: number;
  date_created: string;
  date_modified: string;
  purchasable?: boolean;
  status?: string;
  type?: string;
  meta_data?: Array<{ key: string; value: unknown }>;
}

export interface TutorCourseRecord extends JsonRecord {
  ID?: number;
  post_title?: string;
  post_name?: string;
  course_category?: unknown;
}

export function normalizeCourseSlug(slug: string): string {
  return COURSE_SLUG_ALIASES[slug] || slug;
}

export function isHiddenProduct(product: Pick<WcProduct, "slug">): boolean {
  return HIDDEN_PRODUCT_SLUGS.has(product.slug);
}

export function wcUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${WC_API}${path}`);
  if (WC_KEY && WC_SECRET) {
    url.searchParams.set("consumer_key", WC_KEY);
    url.searchParams.set("consumer_secret", WC_SECRET);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function wcHeaders(contentType = false): HeadersInit {
  return {
    Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`,
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    Accept: "application/json",
    "User-Agent": "SkillsAir-NextJS/1.0",
  };
}

export function tutorHeaders(contentType = false): HeadersInit {
  if (!TUTOR_API_KEY || !TUTOR_API_SECRET) return {};
  return {
    Authorization: `Basic ${Buffer.from(`${TUTOR_API_KEY}:${TUTOR_API_SECRET}`).toString("base64")}`,
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    Accept: "application/json",
  };
}

export function tutorUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TUTOR_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function stripHtml(html = ""): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function cleanImageUrl(value = ""): string {
  const decoded = value.replace(/&amp;/g, "&").trim();
  const nestedHttps = decoded.lastIndexOf("/https://");
  if (nestedHttps > -1) return decoded.slice(nestedHttps + 1);
  const nestedHttp = decoded.lastIndexOf("/http://");
  if (nestedHttp > -1) return decoded.slice(nestedHttp + 1);
  return decoded;
}

function normalizeText(value = ""): string {
  return value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, "");
}

function getNumber(record: JsonRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["posts", "data", "courses", "items", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    if (nested) {
      const nestedItems = extractItems(nested);
      if (nestedItems.length) return nestedItems;
    }
  }
  return [];
}

export async function fetchTutorCourses(): Promise<TutorCourseRecord[]> {
  try {
    const res = await fetch(`${TUTOR_API}/courses`, {
      headers: tutorHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return extractItems(await res.json())
      .map(asRecord)
      .filter((item): item is TutorCourseRecord => Boolean(item));
  } catch {
    return [];
  }
}

export function extractTutorCategories(course?: TutorCourseRecord | null): CourseCategory[] {
  const terms = Array.isArray(course?.course_category) ? course.course_category : [];
  return terms
    .map(asRecord)
    .filter((term): term is JsonRecord => Boolean(term))
    .map((term) => ({
      id: getNumber(term, ["term_id", "id"]),
      name: String(term.name || "").trim(),
      slug: String(term.slug || "").trim(),
      count: getNumber(term, ["count"]),
      description: typeof term.description === "string" ? term.description : undefined,
    }))
    .filter((term) => term.name && term.slug);
}

export function categoriesFromTutorCourses(courses: TutorCourseRecord[]): CourseCategory[] {
  const bySlug = new Map<string, CourseCategory>();
  for (const course of courses) {
    for (const category of extractTutorCategories(course)) {
      const existing = bySlug.get(category.slug);
      bySlug.set(category.slug, {
        ...category,
        count: existing ? Math.max(existing.count, category.count) : category.count,
      });
    }
  }
  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function courseMatchesProduct(course: TutorCourseRecord, product: Pick<WcProduct, "id" | "name" | "slug">): boolean {
  const courseSlug = String(course.post_name || course.slug || "");
  const courseTitle = String(course.post_title || course.title || "");
  const linkedProductId = getNumber(course, ["product_id", "wc_product_id", "_tutor_course_product_id"]);

  return (
    linkedProductId === product.id ||
    normalizeCourseSlug(courseSlug) === normalizeCourseSlug(product.slug) ||
    normalizeText(courseTitle) === normalizeText(product.name)
  );
}

export function findTutorCourseForProduct(
  product: Pick<WcProduct, "id" | "name" | "slug">,
  tutorCourses: TutorCourseRecord[]
): TutorCourseRecord | null {
  return tutorCourses.find((course) => courseMatchesProduct(course, product)) || null;
}

export function tutorCourseId(course?: TutorCourseRecord | null): number {
  return course ? getNumber(course, ["ID", "id", "course_id"]) : 0;
}

function wcCategories(product: WcProduct): CourseCategory[] {
  return product.categories
    .filter((category) => category.name !== "Uncategorized")
    .map((category) => ({ ...category, count: 0 }));
}

export function mapProductToCourse(product: WcProduct, tutorCourse?: TutorCourseRecord | null): Course {
  const tutorCategories = extractTutorCategories(tutorCourse);
  const tutorThumbnail = typeof tutorCourse?.thumbnail_url === "string" ? tutorCourse.thumbnail_url : "";
  const productThumbnail = cleanImageUrl(product.images[0]?.src || "");
  return {
    id: product.id,
    title: product.name,
    slug: product.slug,
    excerpt: stripHtml(product.short_description),
    description: stripHtml(product.description),
    thumbnail: productThumbnail || cleanImageUrl(tutorThumbnail),
    price: parseFloat(product.price) || 0,
    regularPrice: parseFloat(product.regular_price) || 0,
    salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
    isFree: parseFloat(product.price) === 0,
    level: "all",
    status: "publish",
    language: "English",
    duration: 0,
    totalLessons: 0,
    totalStudents: product.total_sales || 0,
    totalSections: 0,
    rating: {
      average: parseFloat(product.average_rating) || 0,
      count: product.rating_count || 0,
      breakdown: {},
    },
    instructor: {
      id: 0,
      name: "SkillsAir Instructor",
      avatar: "",
      bio: "",
      totalStudents: 0,
      totalCourses: 0,
      rating: 0,
      slug: "",
    },
    categories: tutorCategories.length > 0 ? tutorCategories : wcCategories(product),
    tags: [],
    curriculum: [],
    requirements: [],
    outcomes: [],
    targetAudience: [],
    includes: {
      videoHours: 0,
      articles: 0,
      downloadableResources: 0,
      fullLifetimeAccess: true,
      certificate: true,
      mobileAccess: true,
    },
    lastUpdated: product.date_modified || "",
    createdAt: product.date_created || "",
    reviews: [],
  };
}
