import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { ATTRIBUTION_COOKIE, LEAD_COOKIE, leadCookieOptions, parseAttribution } from "@/lib/lead-session";
import { REF_COOKIE } from "@/lib/referral";

interface LeadResult {
  leadId: number;
  leadToken: string;
  hasAccount: boolean;
  resultId?: string;
}

/** Quiz answers are ids only (short strings); the backend validates them and recomputes scores. */
function quizPayload(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const quiz = value as Record<string, unknown>;
  const ids = (input: unknown): Record<string, string> => {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>)
        .slice(0, 30)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .map(([key, id]) => [key.slice(0, 40), id.slice(0, 40)]),
    );
  };
  return {
    version: typeof quiz.version === "string" ? quiz.version.slice(0, 10) : "",
    answers: ids(quiz.answers),
    context: ids(quiz.context),
    tieBreaker: typeof quiz.tieBreaker === "string" ? quiz.tieBreaker.slice(0, 40) : null,
  };
}

const SOURCES = new Set(["apply", "quiz", "curriculum_request", "contact", "employer", "other"]);

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = text(body.firstName, 100);
  const email = text(body.email, 254);
  const phone = text(body.phone, 25);
  const emailOptional = body.source === "curriculum_request";
  if (!firstName || !phone || (!email && !emailOptional)) {
    return NextResponse.json({ message: "First name, WhatsApp number and email are required." }, { status: 400 });
  }

  const attribution = parseAttribution(req.cookies.get(ATTRIBUTION_COOKIE)?.value);
  const referral = req.cookies.get(REF_COOKIE)?.value?.slice(0, 1000);
  const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "apply";

  const upstream = await backendFetch(req, "leads", {
    method: "POST",
    body: JSON.stringify({
      firstName,
      email: email || undefined,
      phone,
      source,
      school: text(body.school, 150) || undefined,
      programme: text(body.programme, 200) || undefined,
      marketingConsent: body.marketingConsent === true,
      marketingConsentText: body.marketingConsent === true ? text(body.marketingConsentText, 1000) : undefined,
      message: text(body.message, 2000) || undefined,
      website: text(body.website, 200) || undefined,
      quiz: source === "quiz" ? quizPayload(body.quiz) : undefined,
      ...attribution,
      // Ambassador referral link (sa_ref): the application counts for the ambassador. Kept until sign-up.
      ...(referral ? { attribution: referral } : {}),
    }),
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ message: "Something went wrong on our side. Your details are safe." }, { status: 502 });
  }
  const payload = (await upstream.json().catch(() => null)) as
    | { success?: boolean; data?: LeadResult; error?: { message?: string; fields?: Record<string, string> } }
    | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json(
      { message: payload?.error?.message || "Something went wrong on our side. Your details are safe.", fields: payload?.error?.fields },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  const response = NextResponse.json(
    { leadId: payload.data.leadId, hasAccount: payload.data.hasAccount, ...(payload.data.resultId ? { resultId: payload.data.resultId } : {}) },
    { status: 201 },
  );
  if (payload.data.leadToken) {
    response.cookies.set(LEAD_COOKIE, payload.data.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  }
  return response;
}
