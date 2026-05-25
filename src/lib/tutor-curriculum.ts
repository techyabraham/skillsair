import type { CourseLesson, CourseSection } from "@/types/course";

const TUTOR_API = process.env.NEXT_PUBLIC_TUTOR_API || "https://api.skillsair.com/wp-json/tutor/v1";
const TUTOR_API_KEY = process.env.TUTOR_API_KEY || process.env.TUTOR_CLIENT_ID || "";
const TUTOR_API_SECRET = process.env.TUTOR_API_SECRET || process.env.TUTOR_SECRET_KEY || "";

type JsonRecord = Record<string, unknown>;

export interface TutorProductLink {
  id: number;
  name: string;
  slug: string;
  meta_data?: Array<{ key: string; value: unknown }>;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

function getString(record: JsonRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return stripHtml(value);
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function getNumber(record: JsonRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function getRawString(record: JsonRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function parseDurationMinutes(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parts = value.split(":").map(Number);
    if (parts.every(Number.isFinite)) {
      if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }
  const record = asRecord(value);
  if (!record) return 0;
  return (
    getNumber(record, ["hours", "hour"]) * 60 +
    getNumber(record, ["minutes", "minute"]) +
    Math.round(getNumber(record, ["seconds", "second"]) / 60)
  );
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["data", "posts", "topics", "lessons", "contents", "items", "results"]) {
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

function tutorHeaders(): HeadersInit {
  if (!TUTOR_API_KEY || !TUTOR_API_SECRET) return {};
  return {
    Authorization: `Basic ${Buffer.from(`${TUTOR_API_KEY}:${TUTOR_API_SECRET}`).toString("base64")}`,
  };
}

async function tutorFetch(path: string, params: Record<string, string> = {}): Promise<unknown | null> {
  const url = new URL(`${TUTOR_API}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const res = await fetch(url, {
      headers: tutorHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function lessonType(record: JsonRecord): CourseLesson["type"] {
  const raw = getString(record, ["type", "post_type", "lesson_type"], "video").toLowerCase();
  if (raw.includes("quiz")) return "quiz";
  if (raw.includes("assignment")) return "assignment";
  if (raw.includes("text")) return "text";
  return "video";
}

function videoSource(video: JsonRecord | null, record: JsonRecord): string {
  const direct = getRawString(record, ["video_url", "videoUrl", "source_html5", "source_external_url", "source_youtube", "source_vimeo", "source_embedded", "source"]);
  if (direct && direct !== "html5" && direct !== "external_url" && direct !== "youtube" && direct !== "vimeo" && direct !== "embedded") return direct;
  if (!video) return "";
  return getRawString(video, [
    "source_html5",
    "source_external_url",
    "source_youtube",
    "source_vimeo",
    "source_embedded",
    "source_shortcode",
    "url",
  ]);
}

function normalizeAttachments(value: unknown): CourseLesson["attachments"] {
  if (!Array.isArray(value)) return [];
  const attachments: NonNullable<CourseLesson["attachments"]> = [];
  value.forEach((item, index) => {
    const record = asRecord(item);
    if (!record) return;
    const url = getRawString(record, ["url", "file", "file_url", "source", "guid"]);
    const title = getString(record, ["title", "name", "post_title"], `Material ${index + 1}`);
    if (!url) return;
    attachments.push({
      id: getRawString(record, ["id", "ID"], String(index + 1)),
      title,
      url,
      type: getString(record, ["type", "mime_type", "post_mime_type"]),
    });
  });
  return attachments;
}

function normalizeLesson(item: unknown, index: number): CourseLesson | null {
  const record = asRecord(item);
  if (!record) return null;
  const id = getNumber(record, ["id", "ID", "lesson_id", "post_id"], index + 1);
  const videoItems = Array.isArray(record.video) ? record.video : [];
  const video = asRecord(videoItems[0]) || asRecord(record.video);
  const content =
    typeof record.content === "string"
      ? record.content
      : typeof record.lesson_content === "string"
        ? record.lesson_content
        : typeof record.post_content === "string"
          ? record.post_content
        : undefined;

  return {
    id,
    title: getString(record, ["title", "post_title", "lesson_title", "name"], `Lesson ${index + 1}`),
    slug: getString(record, ["slug", "post_name"], String(id)),
    duration: parseDurationMinutes(record.duration || record.runtime || record.playtime || video?.runtime || video?.duration_sec),
    type: lessonType(record),
    isPreview: Boolean(record.is_preview || record.preview || record.isPreview),
    videoUrl: videoSource(video, record),
    content,
    attachments: normalizeAttachments(record.attachments),
  };
}

function nestedLessons(record: JsonRecord): unknown[] {
  for (const key of ["lessons", "lesson", "contents", "items", "children", "materials"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function byMenuOrder(a: unknown, b: unknown): number {
  const left = asRecord(a);
  const right = asRecord(b);
  const menuDiff = getNumber(left || {}, ["menu_order", "order"], 0) - getNumber(right || {}, ["menu_order", "order"], 0);
  if (menuDiff !== 0) return menuDiff;
  const leftTitle = getRawString(left || {}, ["post_title", "title", "name"]);
  const rightTitle = getRawString(right || {}, ["post_title", "title", "name"]);
  const leftPrefix = Number(leftTitle.match(/^\s*(\d+)/)?.[1] || 0);
  const rightPrefix = Number(rightTitle.match(/^\s*(\d+)/)?.[1] || 0);
  if (leftPrefix && rightPrefix && leftPrefix !== rightPrefix) return leftPrefix - rightPrefix;
  return getNumber(left || {}, ["ID", "id"], 0) - getNumber(right || {}, ["ID", "id"], 0);
}

function normalizeSections(payload: unknown): CourseSection[] {
  return extractItems(payload)
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      const lessons = nestedLessons(record)
        .sort(byMenuOrder)
        .map(normalizeLesson)
        .filter((lesson): lesson is CourseLesson => Boolean(lesson));
      return {
        id: getNumber(record, ["id", "ID", "topic_id"], index + 1),
        title: getString(record, ["title", "post_title", "topic_title", "name"], `Section ${index + 1}`),
        lessons,
        totalDuration: lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      };
    })
    .filter((section): section is CourseSection => Boolean(section));
}

function metaValue(product: TutorProductLink, keys: string[]): unknown {
  return product.meta_data?.find((meta) => keys.includes(meta.key))?.value;
}

function courseMatchesProduct(course: JsonRecord, product: TutorProductLink): boolean {
  const slug = getString(course, ["slug", "post_name"]);
  const title = getString(course, ["title", "post_title", "course_title", "name"]);
  const productId = getNumber(course, ["product_id", "wc_product_id", "_tutor_course_product_id"]);
  return slug === product.slug || title.toLowerCase() === product.name.toLowerCase() || productId === product.id;
}

async function findTutorCourseId(product: TutorProductLink): Promise<number | null> {
  const linkedId = metaValue(product, [
    "_tutor_course_id",
    "tutor_course_id",
    "_related_course_id",
    "_course_id",
  ]);
  if (typeof linkedId === "number") return linkedId;
  if (typeof linkedId === "string" && Number.isFinite(Number(linkedId))) return Number(linkedId);

  for (let page = 1; page <= 5; page += 1) {
    const payload = await tutorFetch("/courses", { paged: String(page), orderby: "ID", order: "desc" });
    const items = extractItems(payload);
    const match = items
      .map(asRecord)
      .find((course): course is JsonRecord => Boolean(course && courseMatchesProduct(course, product)));
    if (match) return getNumber(match, ["id", "ID", "course_id"]);
    if (!items.length) break;
  }

  return product.id;
}

export async function fetchTutorCurriculum(product: TutorProductLink): Promise<CourseSection[]> {
  const courseId = await findTutorCourseId(product);
  if (!courseId) return [];

  const topics = extractItems(await tutorFetch("/topics", { course_id: String(courseId) }));
  const sections = await Promise.all(
    topics.map(async (topic, index) => {
      const record = asRecord(topic);
      if (!record) return null;
      const topicId = getNumber(record, ["id", "ID", "topic_id"], index + 1);
      const lessons = extractItems(await tutorFetch("/lessons", { topic_id: String(topicId) }))
        .sort(byMenuOrder)
        .map(normalizeLesson)
        .filter((lesson): lesson is CourseLesson => Boolean(lesson));

      return {
        id: topicId,
        title: getString(record, ["title", "post_title", "topic_title", "name"], `Section ${index + 1}`),
        lessons,
        totalDuration: lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      };
    })
  );

  const fromTopics = sections.filter((section): section is CourseSection => Boolean(section));
  if (fromTopics.some((section) => section.lessons.some((lesson) => lesson.videoUrl || lesson.content || (lesson.attachments?.length || 0) > 0))) {
    return fromTopics;
  }

  return normalizeSections(await tutorFetch(`/course-contents/${courseId}`));
}
