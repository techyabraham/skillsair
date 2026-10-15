import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { LEAD_COOKIE } from "@/lib/lead-session";

/** Prefer the applicant's lead token; fall back to the account session for logged-in learners. */
function leadHeaders(req: NextRequest): HeadersInit {
  const leadToken = req.cookies.get(LEAD_COOKIE)?.value;
  return leadToken ? { Authorization: `Bearer ${leadToken}` } : {};
}

async function relay(upstream: Response | null) {
  if (!upstream) return NextResponse.json({ message: "Something went wrong on our side. Your details are safe." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as
    | { data?: Record<string, unknown>; error?: { message?: string } }
    | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json({ message: payload?.error?.message || "Apply first to see your offer." }, { status: upstream.ok ? 502 : upstream.status });
  }
  return NextResponse.json(payload.data);
}

export async function GET(req: NextRequest) {
  return relay(await backendFetch(req, "leads/me", { headers: leadHeaders(req) }).catch(() => null));
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  for (const key of ["currentStatus", "device", "weeklyHours", "programme", "event"]) {
    if (typeof body[key] === "string") allowed[key] = body[key];
  }
  return relay(
    await backendFetch(req, "leads/me", { method: "PATCH", headers: leadHeaders(req), body: JSON.stringify(allowed) }).catch(() => null),
  );
}
