import { NextRequest, NextResponse } from "next/server";
import { normalizeCourseSlug, tutorHeaders, tutorUrl, wcHeaders, wcUrl } from "@/lib/server-course-catalog";
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
  const value = order.meta_data?.find((meta) => meta.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

async function purchasedCertificateSlugs(studentId: number): Promise<Set<string>> {
  const res = await fetch(wcUrl("/orders", {
    customer: String(studentId),
    status: "completed",
    per_page: "100",
  }), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  const orders = await res.json().catch(() => []);
  const slugs = new Set<string>();
  if (!Array.isArray(orders)) return slugs;

  for (const order of orders as WcOrder[]) {
    const orderType = metaValue(order, "_skillsair_order_type");
    const courseSlug = metaValue(order, "_skillsair_certificate_course_slug");
    if (orderType === "certificate" && courseSlug) {
      slugs.add(normalizeCourseSlug(courseSlug));
    }
  }

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

  const res = await fetch(tutorUrl(`/students/${studentId}/courses`), {
    headers: tutorHeaders(),
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  const courses = Array.isArray(payload.data?.enrolled_courses) ? payload.data.enrolled_courses : [];
  const origin = req.nextUrl.origin;
  const purchasedSlugs = await purchasedCertificateSlugs(studentId);

  const certificates: Certificate[] = courses
    .filter((course: Record<string, unknown>) => progress(course.course_completed_percentage) >= 100)
    .filter((course: Record<string, unknown>) => {
      const slug = String(course.post_name || course.slug || "");
      return purchasedSlugs.has(normalizeCourseSlug(slug));
    })
    .map((course: Record<string, unknown>) => {
      const courseId = Number(course.ID || course.id || course.course_id);
      const title = String(course.post_title || course.title || "Course");
      const issuedAt = String(course.post_modified || course.post_date || new Date().toISOString());
      const verificationCode = `SA-${studentId}-${courseId}`;
      return {
        id: verificationCode,
        courseId,
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
