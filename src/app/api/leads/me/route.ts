import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";
import { LEAD_COOKIE, leadCookieOptions } from "@/lib/lead-session";

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

/**
 * A signed-in learner applies with their account details (no name/phone/email form). Uses the
 * account session only, never a lead cookie left by someone else on this browser.
 */
export async function POST(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Log in to apply with your account." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const programme = typeof body.programme === "string" ? body.programme.slice(0, 200) : "";
  const school = typeof body.school === "string" ? body.school.slice(0, 150) : "";
  if (!programme) return NextResponse.json({ message: "Choose a programme first." }, { status: 400 });
  const upstream = await backendFetch(req, "leads/me", { method: "POST", body: JSON.stringify({ programme, school: school || undefined }) }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "Something went wrong on our side. Your details are safe." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as
    | { data?: { leadToken?: string; answered?: boolean }; error?: { message?: string; fields?: Record<string, string> } }
    | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json(
      { message: payload?.error?.message || "Something went wrong on our side.", needsPhone: Boolean(payload?.error?.fields?.phone) },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }
  const response = NextResponse.json({ answered: Boolean(payload.data.answered) });
  if (payload.data.leadToken) response.cookies.set(LEAD_COOKIE, payload.data.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  return response;
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
