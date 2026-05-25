import { NextRequest, NextResponse } from "next/server";
import {
  fetchTutorCourses,
  findTutorCourseForProduct,
  mapProductToCourse,
  tutorHeaders,
  tutorUrl,
  wcHeaders,
  wcUrl,
  type TutorCourseRecord,
  type WcProduct,
} from "@/lib/server-course-catalog";
import type { EnrolledCourse } from "@/types/course";

function stripHtml(html = ""): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

function tutorId(course: TutorCourseRecord): number {
  const value = course.ID || course.id || course.course_id;
  return Number(value) || 0;
}

function matchProduct(course: TutorCourseRecord, products: WcProduct[], tutorCourses: TutorCourseRecord[]): WcProduct | null {
  return products.find((product) => findTutorCourseForProduct(product, tutorCourses)?.ID === course.ID) || null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return NextResponse.json({ message: "Invalid student ID" }, { status: 400 });
  }

  const enrolledRes = await fetch(tutorUrl(`/students/${studentId}/courses`), {
    headers: tutorHeaders(),
    cache: "no-store",
  });
  const enrolledPayload = await enrolledRes.json().catch(() => ({}));
  if (!enrolledRes.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const enrolled = Array.isArray(enrolledPayload.data?.enrolled_courses)
    ? (enrolledPayload.data.enrolled_courses as TutorCourseRecord[])
    : [];
  const [products, tutorCourses] = await Promise.all([
    fetch(wcUrl("/products", { type: "subscription", status: "publish", per_page: "100" }), {
      headers: wcHeaders(),
      next: { revalidate: 60 },
    }).then((res) => res.json() as Promise<WcProduct[]>).catch(() => []),
    fetchTutorCourses(),
  ]);

  const courses: EnrolledCourse[] = enrolled.map((course) => {
    const product = matchProduct(course, products, tutorCourses);
    const base = product
      ? mapProductToCourse(product, course)
      : mapProductToCourse({
          id: tutorId(course),
          name: String(course.post_title || course.title || "Course"),
          slug: String(course.post_name || course.slug || tutorId(course)),
          description: String(course.post_content || ""),
          short_description: String(course.post_excerpt || ""),
          price: "0",
          regular_price: "0",
          sale_price: "",
          images: [],
          categories: [],
          average_rating: "0",
          rating_count: 0,
          total_sales: 0,
          date_created: String(course.post_date || ""),
          date_modified: String(course.post_modified || ""),
        }, course);
    return {
      ...base,
      excerpt: base.excerpt || stripHtml(String(course.post_excerpt || course.post_content || "")).slice(0, 180),
      progress: progress(course.course_completed_percentage),
      enrolledAt: String(course.post_date || new Date().toISOString()),
      lastAccessed: String(course.post_modified || new Date().toISOString()),
      completedLessons: [],
    };
  });

  return NextResponse.json(courses);
}
