import { NextRequest, NextResponse } from "next/server";
import { tutorHeaders, tutorUrl, wcHeaders, wcUrl } from "@/lib/server-course-catalog";

function progress(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace("%", "")) || 0;
  return 0;
}

async function countEnrolledFromOrders(studentId: number): Promise<number> {
  try {
    const [completedRes, processingRes] = await Promise.all([
      fetch(wcUrl("/orders", { customer: String(studentId), status: "completed", per_page: "100" }), {
        headers: wcHeaders(), cache: "no-store",
      }),
      fetch(wcUrl("/orders", { customer: String(studentId), status: "processing", per_page: "100" }), {
        headers: wcHeaders(), cache: "no-store",
      }),
    ]);

    const allOrders: Array<{ line_items?: Array<{ product_id?: number }> }> = [
      ...(completedRes.ok ? await completedRes.json().catch(() => []) : []),
      ...(processingRes.ok ? await processingRes.json().catch(() => []) : []),
    ];

    if (!Array.isArray(allOrders) || allOrders.length === 0) return 0;

    const productIds = new Set<number>();
    for (const order of allOrders) {
      for (const item of order.line_items || []) {
        if (typeof item.product_id === "number" && item.product_id > 0) {
          productIds.add(item.product_id);
        }
      }
    }
    return productIds.size;
  } catch {
    return 0;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return NextResponse.json({ message: "Invalid student ID" }, { status: 400 });
  }

  let totalEnrolled = 0;
  let totalCompleted = 0;

  try {
    const res = await fetch(
      tutorUrl("/courses", { student_id: String(studentId), per_page: "100" }),
      { headers: tutorHeaders(), cache: "no-store" }
    );
    if (res.ok) {
      const payload = await res.json().catch(() => ({}));
      const courses = Array.isArray(payload.data?.posts) ? payload.data.posts : [];
      if (courses.length > 0) {
        totalEnrolled = courses.length;
        totalCompleted = courses.filter((course: Record<string, unknown>) =>
          progress(course.course_completed_percentage) >= 100
        ).length;
      }
    }
  } catch { /* fall through to WC fallback */ }

  // WooCommerce fallback: count unique purchased course products
  if (totalEnrolled === 0) {
    totalEnrolled = await countEnrolledFromOrders(studentId);
  }

  return NextResponse.json({
    totalEnrolled,
    totalCompleted,
    totalCertificates: totalCompleted,
    totalWatchedHours: 0,
    currentStreak: 0,
  });
}
