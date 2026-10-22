import type { Course, CourseCategory, CourseLesson, CourseSection } from "@/types/course";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" ? value as RecordValue : {};
}

function records(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const docs = record(value).docs;
  return Array.isArray(docs) ? docs : [];
}

function relationId(value: unknown): number {
  const rel = record(value);
  const id = typeof value === "object" && value !== null ? rel.id : value;
  return Number(id) || 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function richText(value: unknown): string {
  if (typeof value === "string") return value;
  const pieces: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const current = record(node);
    if (typeof current.text === "string") pieces.push(current.text);
    if (current.children) visit(current.children);
  };
  visit(value);
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

function mediaUrl(value: unknown): string {
  return text(record(value).url);
}

function legacyDriveId(value: unknown): string {
  let id = "";
  const visit = (node: unknown) => {
    if (id) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const current = record(node);
    const fields = record(current.fields);
    if (typeof fields.url === "string") {
      try {
        const url = new URL(fields.url);
        if (url.hostname === "api.skillsair.com" && url.pathname === "/wp-admin/admin-ajax.php" && url.searchParams.get("action") === "igd_stream") {
          const candidate = url.searchParams.get("id") || "";
          if (/^[A-Za-z0-9_-]{10,}$/.test(candidate)) id = candidate;
        }
      } catch {
        return;
      }
    }
    Object.values(current).forEach(visit);
  };
  visit(value);
  return id;
}

function mapCategory(value: unknown): CourseCategory {
  const category = record(value);
  return {
    id: relationId(category),
    name: text(category.name),
    slug: text(category.slug),
    count: Number(category.courseCount || 0),
    description: text(category.description),
  };
}

function mapLesson(value: unknown): CourseLesson {
  const lesson = record(value);
  const id = relationId(lesson);
  const lessonContent = richText(lesson.content);
  const hasDriveVideo = Boolean(text(lesson.driveFileId) || legacyDriveId(lesson.content));
  const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];
  // Documents kept in Google Drive, opened through the same-origin media route (access-checked).
  const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
  return {
    id,
    title: text(lesson.title),
    slug: text(lesson.slug),
    duration: Number(lesson.duration || 0),
    type: hasDriveVideo ? "video" : lessonContent || resources.length ? "text" : "video",
    isPreview: Boolean(lesson.isFree),
    isCompleted: Boolean(lesson.isCompleted),
    videoUrl: hasDriveVideo ? `/api/media/lesson/${id}` : "",
    content: lessonContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join(""),
    attachments: attachments.map((attachment): NonNullable<CourseLesson["attachments"]>[number] => {
      const file = record(attachment);
      return {
        id: relationId(file),
        title: text(file.alt) || text(file.filename) || "Course material",
        url: mediaUrl(file),
        type: text(file.mimeType),
      };
    }).concat(resources.map((resource, index) => {
      const file = record(resource);
      return {
        id: `${id}-resource-${index}`,
        title: text(file.title) || "Course material",
        url: `/api/media/lesson/${id}/resources/${index}`,
        type: text(file.mimeType),
      };
    })),
  };
}

function mapSection(value: unknown): CourseSection {
  const section = record(value);
  const lessons = records(section.lessons)
    .filter((lesson) => Boolean(lesson && typeof lesson === "object" && !Array.isArray(lesson)))
    .sort((a, b) => Number(record(a).order || 0) - Number(record(b).order || 0))
    .map(mapLesson)
  return {
    id: relationId(section),
    title: text(section.title),
    lessons,
    totalDuration: lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
  };
}

/** Public catalogue shape: the scholarship offer is revealed only after Apply, so no prices. */
export function toPublicCourse(course: Course): Course {
  const { price: _price, regularPrice: _regular, salePrice: _sale, ...rest } = course;
  void _price;
  void _regular;
  void _sale;
  return rest;
}

export function mapBackendCourse(value: unknown): Course {
  const course = record(value);
  const instructor = record(course.instructor);
  const sections = records(course.sections)
    .sort((a, b) => Number(record(a).order || 0) - Number(record(b).order || 0))
    .map(mapSection)
  const categories = records(course.categories)
    .map(mapCategory)
    .filter((category) => category.name && category.slug);
  const requirements = (Array.isArray(course.requirements) ? course.requirements : [])
    .map((item) => text(record(item).requirement) || text(item))
    .filter(Boolean);
  const outcomes = (Array.isArray(course.objectives) ? course.objectives : [])
    .map((item) => text(record(item).objective) || text(item))
    .filter(Boolean);
  const durationSeconds = Number(course.totalDuration || sections.reduce((sum, section) => sum + section.totalDuration, 0));
  const price = Number(course.price || 0);

  return {
    id: relationId(course),
    title: text(course.title),
    slug: text(course.slug),
    excerpt: text(course.shortDescription) || richText(course.description),
    description: richText(course.description),
    thumbnail: mediaUrl(course.thumbnail),
    price,
    regularPrice: price,
    isFree: price <= 0,
    level: course.level === "beginner" || course.level === "intermediate" || course.level === "advanced"
      ? course.level
      : "all",
    status: course.status === "published" ? "publish" : "draft",
    language: "English",
    duration: Math.round(durationSeconds / 3600),
    totalLessons: Number(course.totalLessons || sections.reduce((sum, section) => sum + section.lessons.length, 0)),
    totalStudents: Number(course.totalStudents || 0),
    totalSections: sections.length,
    rating: { average: Number(course.averageRating || 0), count: Number(course.reviewCount || 0), breakdown: {} },
    instructor: {
      id: relationId(instructor),
      name: `${text(instructor.firstName)} ${text(instructor.lastName)}`.trim() || text(instructor.email) || "SkillsAir Instructor",
      avatar: mediaUrl(instructor.avatar),
      bio: text(instructor.bio),
      totalStudents: 0,
      totalCourses: 0,
      rating: 0,
      slug: text(instructor.slug),
    },
    categories,
    tags: [],
    curriculum: sections,
    requirements,
    outcomes,
    targetAudience: [],
    includes: {
      videoHours: Math.round(durationSeconds / 3600),
      articles: sections.flatMap((section) => section.lessons).filter((lesson) => lesson.type === "text").length,
      downloadableResources: sections.flatMap((section) => section.lessons).reduce((sum, lesson) => sum + (lesson.attachments?.length || 0), 0),
      fullLifetimeAccess: false,
      certificate: true,
      mobileAccess: true,
    },
    lastUpdated: text(course.updatedAt),
    createdAt: text(course.publishedAt) || text(course.createdAt),
    reviews: [],
  };
}
