import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface VerifyResult {
  status: string;
  order?: { id: number; type?: string; amount?: number; course?: number | { id?: number; slug?: string } | null };
}

export async function GET(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ paid: false, status: "unauthenticated", message: "Sign in to verify this payment." }, { status: 401 });
  const reference = req.nextUrl.searchParams.get("reference") || "";
  if (!reference) return NextResponse.json({ paid: false, status: "invalid", message: "Payment reference is missing." }, { status: 400 });
  const response = await backendFetch(req, `payments/verify/${encodeURIComponent(reference)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ paid: false, status: "error", message: body?.error?.message || "Payment verification failed." }, { status: response.status });
  }
  const result = await backendPayload<VerifyResult>(response);
  // Certificate payments go straight on to the final exam intro, which needs the programme slug.
  let courseSlug: string | undefined;
  const course = result.order?.course;
  if (result.status === "success" && result.order?.type === "certificate" && course) {
    if (typeof course === "object" && course.slug) courseSlug = course.slug;
    else {
      const id = typeof course === "object" ? course.id : course;
      const lookup = id ? await backendFetch(req, `courses/${id}?depth=0`).catch(() => null) : null;
      const doc = lookup?.ok ? await lookup.json().catch(() => null) as { slug?: string } | null : null;
      courseSlug = doc?.slug;
    }
  }
  return NextResponse.json({
    courseSlug,
    paid: result.status === "success",
    status: result.status,
    orderId: result.order?.id,
    message: result.status === "success" ? undefined : "Payment is still pending. If you completed payment, refresh this page in a moment.",
    type: result.order?.type,
    amount: result.order?.amount,
  });
}
