import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import type { StudentStats } from "@/types/user";

interface PayloadList<T> { docs?: T[] }
interface Enrollment { status?: string; progressPercent?: number }
interface Certificate { id: number }
interface LessonProgress { watchedSeconds?: number; lastWatchedAt?: string }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const [enrollmentRes, certificateRes, progressRes] = await Promise.all([
    backendFetch(req, `enrollments?limit=1000&depth=0&where[student][equals]=${encodeURIComponent(params.id)}`),
    backendFetch(req, `certificates?limit=1000&depth=0&where[student][equals]=${encodeURIComponent(params.id)}`),
    backendFetch(req, `lesson-progress?limit=5000&depth=0&where[student][equals]=${encodeURIComponent(params.id)}`),
  ]);
  if (!enrollmentRes.ok || !certificateRes.ok || !progressRes.ok) {
    return NextResponse.json({ message: "Unable to load your learning statistics." }, { status: 502 });
  }
  const enrollments = await backendPayload<PayloadList<Enrollment>>(enrollmentRes);
  const certificates = await backendPayload<PayloadList<Certificate>>(certificateRes);
  const progress = await backendPayload<PayloadList<LessonProgress>>(progressRes);
  const active = (enrollments.docs || []).filter((item) => item.status !== "refunded");
  const activityDays = new Set((progress.docs || []).map((item) => item.lastWatchedAt?.slice(0, 10)).filter((day): day is string => Boolean(day)));
  let currentStreak = 0;
  const date = new Date();
  if (!activityDays.has(date.toISOString().slice(0, 10))) date.setUTCDate(date.getUTCDate() - 1);
  while (activityDays.has(date.toISOString().slice(0, 10))) {
    currentStreak += 1;
    date.setUTCDate(date.getUTCDate() - 1);
  }
  const stats: StudentStats = {
    totalEnrolled: active.length,
    totalCompleted: active.filter((item) => item.status === "completed" || Number(item.progressPercent) >= 100).length,
    totalCertificates: certificates.docs?.length || 0,
    totalWatchedHours: Math.round((progress.docs || []).reduce((sum, item) => sum + Number(item.watchedSeconds || 0), 0) / 3600),
    currentStreak,
  };
  return NextResponse.json(stats);
}
