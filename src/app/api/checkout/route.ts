import { REF_COOKIE } from "@/lib/referral";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface CourseRecord { id: number; slug: string; title: string }
interface PayloadList<T> { docs?: T[] }
interface PaymentStart { authorizationUrl: string; reference: string; orderId: number }

async function findCourse(req: NextRequest, slug: string): Promise<CourseRecord | null> {
  const query = new URLSearchParams({ limit: "1", depth: "0", "where[slug][equals]": slug, "where[status][equals]": "published" });
  const response = await backendFetch(req, `courses?${query}`);
  if (!response.ok) return null;
  const payload = await backendPayload<PayloadList<CourseRecord>>(response);
  return payload.docs?.[0] || null;
}

async function beginPayment(req: NextRequest, path: string, body: Record<string, unknown>, paymentMethod: string, replacesOrderId?: string) {
  const paymentBody = { ...body, attribution: req.cookies.get(REF_COOKIE)?.value, paymentMethod, ...(replacesOrderId ? { replacesOrderId } : {}) };
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
  // Bank transfer is the default; OPay and the full Paystack checkout are the other options.
  const paymentMethod = body.paymentMethod === "opay" || body.paymentMethod === "paystack" ? body.paymentMethod : "bank_transfer";
  // "Complete payment" from order history: the backend closes this pending order once the new one starts.
  const replacesOrderId = typeof body.replacesOrderId === "string" && /^\d+$/.test(body.replacesOrderId) ? body.replacesOrderId : undefined;
  const course = await findCourse(req, certificateCourseSlug || courseSlug);
  if (!course) return NextResponse.json({ message: "This course is unavailable in the new learning platform." }, { status: 404 });

  if (certificateCourseSlug) {
    return beginPayment(req, "certificates/purchase", { courseId: String(course.id) }, paymentMethod, replacesOrderId);
  }

  if (body.purchaseType === "subscription") {
    const planId = typeof body.planId === "string" || typeof body.planId === "number"
      ? String(body.planId)
      : "";
    if (!/^\d+$/.test(planId)) {
      return NextResponse.json({ message: "Choose a valid subscription plan for this course." }, { status: 400 });
    }
    const planQuery = new URLSearchParams({
      limit: "1",
      depth: "0",
      "where[id][equals]": planId,
      "where[course][equals]": String(course.id),
      "where[isActive][equals]": "true",
    });
    const plansResponse = await backendFetch(req, `plans?${planQuery}`);
    if (!plansResponse.ok) {
      const payload = await plansResponse.json().catch(() => null) as { error?: { message?: string } } | null;
      return NextResponse.json({ message: payload?.error?.message || "Unable to verify this subscription plan." }, { status: plansResponse.status });
    }
    const plans = await backendPayload<PayloadList<{ id: number }>>(plansResponse);
    if (!plans.docs?.length) {
      return NextResponse.json({ message: "That plan is not active for this course." }, { status: 404 });
    }
    return beginPayment(req, "payments/initiate", { type: "subscription", planId }, paymentMethod, replacesOrderId);
  }

  // Course cards and checkout show a one-time course price. Send that purchase
  // to the backend's course-payment flow; subscription plans are a separate,
  // course-specific product and must not be inferred from the course price.
  return beginPayment(
    req,
    "payments/initiate",
    { type: "course", courseId: String(course.id) },
    paymentMethod,
    replacesOrderId,
  );
}
