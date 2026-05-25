import { NextRequest, NextResponse } from "next/server";
import { tutorHeaders, tutorUrl } from "@/lib/server-course-catalog";

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

export async function GET(
  _req: NextRequest,
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
  const totalCompleted = courses.filter((course: Record<string, unknown>) => progress(course.course_completed_percentage) >= 100).length;

  return NextResponse.json({
    totalEnrolled: courses.length,
    totalCompleted,
    totalCertificates: totalCompleted,
    totalWatchedHours: 0,
    currentStreak: 0,
  });
}
