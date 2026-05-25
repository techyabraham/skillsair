import { NextRequest, NextResponse } from "next/server";
import { tutorHeaders, tutorUrl } from "@/lib/server-course-catalog";
import type { Certificate } from "@/types/course";

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
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

  const certificates: Certificate[] = courses
    .filter((course: Record<string, unknown>) => progress(course.course_completed_percentage) >= 100)
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
