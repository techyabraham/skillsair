import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import { mapBackendCourse } from "@/lib/backend-course-mapper";
import type { EnrolledCourse } from "@/types/course";

interface EnrollmentRecord {
  id: number;
  status?: string;
  enrolledAt?: string;
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  progressPercent?: number;
  course?: unknown;
}

interface PayloadList {
  docs?: EnrollmentRecord[];
}
interface ProgressRecord { course?: number | { id?: number }; lesson?: number | { id?: number }; isCompleted?: boolean }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const query = new URLSearchParams({
    depth: "2",
    limit: "1000",
    sort: "-enrolledAt",
    "where[student][equals]": params.id,
  });
  const response = await backendFetch(req, `enrollments?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load your courses." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const progressQuery = new URLSearchParams({
    depth: "0",
    limit: "5000",
    "where[student][equals]": params.id,
    "where[isCompleted][equals]": "true",
  });
  const progressResponse = await backendFetch(req, `lesson-progress?${progressQuery}`);
  const progressPayload = progressResponse.ok
    ? await backendPayload<{ docs?: ProgressRecord[] }>(progressResponse)
    : { docs: [] };
  const completedByCourse = new Map<number, number[]>();
  for (const progress of progressPayload.docs || []) {
    const courseId = typeof progress.course === "object" && progress.course ? Number(progress.course.id) : Number(progress.course);
    const lessonId = typeof progress.lesson === "object" && progress.lesson ? Number(progress.lesson.id) : Number(progress.lesson);
    if (courseId && lessonId) completedByCourse.set(courseId, [...(completedByCourse.get(courseId) || []), lessonId]);
  }
  const courses: EnrolledCourse[] = (payload.docs || [])
    .filter((enrollment) => enrollment.status !== "refunded" && enrollment.course)
    .map((enrollment) => {
      const course = mapBackendCourse(enrollment.course);
      return {
        ...course,
        enrolledAt: enrollment.enrolledAt || enrollment.createdAt || "",
        progress: Math.max(0, Math.min(100, Number(enrollment.progressPercent || 0))),
        lastAccessed: enrollment.updatedAt || enrollment.enrolledAt || enrollment.createdAt || "",
        completedLessons: completedByCourse.get(course.id) || [],
        ...(enrollment.completedAt ? { completedAt: enrollment.completedAt } : {}),
      };
    });
  return NextResponse.json(courses);
}
