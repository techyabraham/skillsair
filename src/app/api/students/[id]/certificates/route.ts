import { NextRequest, NextResponse } from "next/server";
import {
  normalizeCourseSlug,
  tutorHeaders,
  tutorUrl,
  wcHeaders,
  wcUrl,
  fetchTutorCourses,
  findTutorCourseForProduct,
  mapProductToCourse,
  type WcProduct,
} from "@/lib/server-course-catalog";
import type { Certificate } from "@/types/course";

interface WcOrder {
  id: number;
  status?: string;
  meta_data?: Array<{ key: string; value: unknown }>;
}

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

function metaValue(order: WcOrder, key: string): string {
  const value = order.meta_data?.find((m) => m.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

/** Returns slugs of courses whose certificate has been purchased. */
async function purchasedCertificateSlugs(studentId: number): Promise<Set<string>> {
  const slugs = new Set<string>();
  try {
    const [completedRes, processingRes] = await Promise.all([
      fetch(wcUrl("/orders", { customer: String(studentId), status: "completed", per_page: "100" }), {
        headers: wcHeaders(), cache: "no-store",
      }),
      fetch(wcUrl("/orders", { customer: String(studentId), status: "processing", per_page: "100" }), {
        headers: wcHeaders(), cache: "no-store",
      }),
    ]);
    const orders: WcOrder[] = [
      ...(completedRes.ok ? await completedRes.json().catch(() => []) : []),
      ...(processingRes.ok ? await processingRes.json().catch(() => []) : []),
    ];
    for (const order of orders) {
      const orderType = metaValue(order, "_skillsair_order_type");
      const courseSlug = metaValue(order, "_skillsair_certificate_course_slug");
      if (orderType === "certificate" && courseSlug) {
        slugs.add(normalizeCourseSlug(courseSlug));
      }
    }
  } catch { /* ignore */ }
  return slugs;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return NextResponse.json({ message: "Invalid student ID" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const purchasedSlugs = await purchasedCertificateSlugs(studentId);

  // No purchased certificates at all — return empty quickly
  if (purchasedSlugs.size === 0) {
    return NextResponse.json([]);
  }

  // Try TutorLMS for enrollment + completion data
  let tutorCourses: Array<Record<string, unknown>> = [];
  try {
    const res = await fetch(tutorUrl(`/students/${studentId}/courses`), {
      headers: tutorHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const payload = await res.json().catch(() => ({}));
      tutorCourses = Array.isArray(payload.data?.enrolled_courses)
        ? payload.data.enrolled_courses
        : [];
    }
  } catch { /* fall through */ }

  // Fallback: if TutorLMS gave nothing, infer completed courses from WC orders
  if (tutorCourses.length === 0) {
    try {
      const [allProducts, allTutorCourses] = await Promise.all([
        fetch(wcUrl("/products", { status: "publish", per_page: "100" }), {
          headers: wcHeaders(), next: { revalidate: 60 },
        }).then((r) => r.json() as Promise<WcProduct[]>).catch(() => [] as WcProduct[]),
        fetchTutorCourses(),
      ]);

      const certificates: Certificate[] = (allProducts as WcProduct[])
        .filter((p) => purchasedSlugs.has(normalizeCourseSlug(p.slug)))
        .map((product) => {
          const tutorCourse = findTutorCourseForProduct(product, allTutorCourses) ?? undefined;
          const base = mapProductToCourse(product, tutorCourse);
          const courseId = base.id;
          const slug = normalizeCourseSlug(product.slug);
          const verificationCode = `SA-${studentId}-${courseId}`;
          return {
            id: verificationCode,
            courseId,
            courseSlug: slug,
            courseName: base.title,
            courseThumbnail: base.thumbnail || "",
            studentName: "",
            issuedAt: product.date_modified || new Date().toISOString(),
            certificateUrl: `${origin}/api/certificates/${studentId}/${courseId}`,
            verificationCode,
          };
        });

      return NextResponse.json(certificates);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Map TutorLMS courses to Certificate objects
  const certificates: Certificate[] = tutorCourses
    .filter((course) => progress(course.course_completed_percentage) >= 100)
    .filter((course) => {
      const slug = String(course.post_name || course.slug || "");
      return purchasedSlugs.has(normalizeCourseSlug(slug));
    })
    .map((course) => {
      const courseId = Number(course.ID || course.id || course.course_id);
      const slug = String(course.post_name || course.slug || "");
      const title = String(course.post_title || course.title || "Course");
      const issuedAt = String(course.post_modified || course.post_date || new Date().toISOString());
      const verificationCode = `SA-${studentId}-${courseId}`;
      return {
        id: verificationCode,
        courseId,
        courseSlug: normalizeCourseSlug(slug),
        courseName: title,
        courseThumbnail: "",
        studentName: "",
        issuedAt,
        certificateUrl: `${origin}/api/certificates/${studentId}/${courseId}`,
        verificationCode,
      };
    });

  return NextResponse.json(certificates);
}
