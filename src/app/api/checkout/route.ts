import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface CourseRecord { id: number; slug: string; title: string; price: number }
interface PayloadList<T> { docs?: T[] }
interface PaymentStart { authorizationUrl: string; reference: string; orderId: number }

async function findCourse(req: NextRequest, slug: string): Promise<CourseRecord | null> {
  const query = new URLSearchParams({ limit: "1", depth: "0", "where[slug][equals]": slug, "where[status][equals]": "published" });
  const response = await backendFetch(req, `courses?${query}`);
  if (!response.ok) return null;
  const payload = await backendPayload<PayloadList<CourseRecord>>(response);
  return payload.docs?.[0] || null;
}

async function beginPayment(req: NextRequest, path: string, body: Record<string, unknown>, paymentMethod: string) {
  const paymentBody = { ...body, paymentMethod };
  const response = await backendFetch(req, path, { method: "POST", body: JSON.stringify(paymentBody) });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: payload?.error?.message || "Could not start payment." }, { status: response.status });
  }
  const payment = await backendPayload<PaymentStart>(response);
  return NextResponse.json({ ...payment, newAccount: false });
}

export async function POST(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in before checkout." }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const certificateCourseSlug = typeof body.certificateCourseSlug === "string" ? body.certificateCourseSlug : "";
  const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug : "";
  const paymentMethod = body.paymentMethod === "bank_transfer" ? "bank_transfer" : "paystack";
  const course = await findCourse(req, certificateCourseSlug || courseSlug);
  if (!course) return NextResponse.json({ message: "This course is unavailable in the new learning platform." }, { status: 404 });

  if (certificateCourseSlug) {
    return beginPayment(req, "certificates/purchase", { courseId: String(course.id) }, paymentMethod);
  }

  const planQuery = new URLSearchParams({
    limit: "10",
    depth: "1",
    "where[course][equals]": String(course.id),
    "where[isActive][equals]": "true",
    "where[interval][equals]": "monthly",
  });
  const plansResponse = await backendFetch(req, `plans?${planQuery}`);
  if (plansResponse.ok) {
    const plans = await backendPayload<PayloadList<{ id: number; price: number; interval: string }>>(plansResponse);
    const plan = plans.docs?.[0];
    if (!plan) return NextResponse.json({ message: "Monthly billing is not configured for this course yet." }, { status: 503 });
    if (Number(plan.price) !== Number(course.price)) {
      return NextResponse.json({ message: "The course price and monthly plan price do not match. Please contact support." }, { status: 409 });
    }
    return beginPayment(req, "payments/initiate", { type: "subscription", planId: String(plan.id) }, paymentMethod);
  }
  return NextResponse.json({ message: "Unable to verify the monthly plan for this course. Please try again shortly." }, { status: 502 });
}
