import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

async function relay(upstream: Response | null) {
  if (!upstream) return NextResponse.json({ message: "Laptop support is temporarily unavailable." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as { data?: unknown; error?: { message?: string; fields?: Record<string, string> } } | null;
  if (!upstream.ok) {
    return NextResponse.json({ message: payload?.error?.message || "Request failed.", fields: payload?.error?.fields }, { status: upstream.status });
  }
  return NextResponse.json(payload?.data ?? {});
}

/** Eligibility and the learner's own application. Identity comes from the session, never the client. */
export async function GET(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  return relay(await backendFetch(req, "laptop-applications/mine").catch(() => null));
}

export async function POST(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return relay(
    await backendFetch(req, "laptop-applications/apply", {
      method: "POST",
      body: JSON.stringify({
        story: typeof body.story === "string" ? body.story : "",
        currentDevice: body.currentDevice,
        plannedUse: typeof body.plannedUse === "string" ? body.plannedUse : "",
        consentToFeature: body.consentToFeature === true,
      }),
    }).catch(() => null),
  );
}
