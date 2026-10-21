import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { siteOrigin } from "@/lib/site-origin";

/**
 * GET /billing/update-card[?subscription=<id>]: the link in dunning emails, WhatsApp and the
 * dashboard banner. Asks the backend for the learner's Paystack "manage subscription" link
 * (or, if Paystack can't give one, a checkout link for the same plan) and redirects there.
 * Not signed in → login first, then back here.
 */
const ALLOWED_HOSTS = [/^(.+\.)?paystack\.com$/i, /^(.+\.)?paystack\.co$/i];

function safeTarget(url: string, req: NextRequest): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return `${siteOrigin(req)}${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (parsed.origin === siteOrigin(req)) return parsed.toString();
    return ALLOWED_HOSTS.some((pattern) => pattern.test(parsed.hostname)) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const subscription = req.nextUrl.searchParams.get("subscription");
  const query = subscription && /^\d+$/.test(subscription) ? `?subscription=${subscription}` : "";
  const upstream = await backendFetch(req, `billing/update-card${query}`).catch(() => null);
  const site = siteOrigin(req);

  if (upstream?.status === 401) {
    return NextResponse.redirect(`${site}/login?next=${encodeURIComponent(`/billing/update-card${query}`)}`);
  }
  const body = (await upstream?.json().catch(() => null)) as { data?: { url?: string } } | null;
  const target = upstream?.ok && body?.data?.url ? safeTarget(body.data.url, req) : null;
  if (!target) return NextResponse.redirect(`${site}/dashboard/subscription?card=unavailable`);
  return NextResponse.redirect(target);
}
