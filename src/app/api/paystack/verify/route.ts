import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface VerifyResult {
  status: string;
  order?: { id: number; type?: string };
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
  return NextResponse.json({
    paid: result.status === "success",
    status: result.status,
    orderId: result.order?.id,
    message: result.status === "success" ? undefined : "Payment is still pending. If you completed payment, refresh this page in a moment.",
    type: result.order?.type,
  });
}
