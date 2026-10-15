import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { ATTRIBUTION_COOKIE, LEAD_COOKIE, leadCookieOptions, parseAttribution } from "@/lib/lead-session";

interface LeadResult {
  leadId: number;
  leadToken: string;
  hasAccount: boolean;
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
      ...attribution,
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

  const response = NextResponse.json({ leadId: payload.data.leadId, hasAccount: payload.data.hasAccount }, { status: 201 });
  if (payload.data.leadToken) {
    response.cookies.set(LEAD_COOKIE, payload.data.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  }
  return response;
}
