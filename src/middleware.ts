import { NextResponse, type NextRequest } from "next/server";
import { EXPERIMENT_COOKIE, randomAssignments, serialiseAssignments } from "@/lib/experiments";
import { applyClientIpHeaders, backendUrl, clientIp } from "@/lib/backend-api";
import { siteOrigin } from "@/lib/site-origin";
import {
  REF_COOKIE,
  VISITOR_COOKIE,
  findRef,
  isBot,
  isValidRef,
  isValidVisitorId,
  parseTrackResponse,
  refCookieDecision,
  stripRef,
  utmFrom,
  type TrackOutcome,
} from "@/lib/referral";

const TRACK_TIMEOUT_MS = 1500;
const YEAR = 365 * 24 * 60 * 60;

/** Assigns a stable A/B variant on the first view of the home page (first-party cookie, 90 days). */
function assignExperiment(req: NextRequest): NextResponse {
  if (req.cookies.get(EXPERIMENT_COOKIE)) return NextResponse.next();
  const value = serialiseAssignments(randomAssignments());
  // Make the assignment visible to this same request's server render.
  const headers = new Headers(req.headers);
  const cookie = req.headers.get("cookie");
  headers.set("cookie", `${cookie ? `${cookie}; ` : ""}${EXPERIMENT_COOKIE}=${value}`);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(EXPERIMENT_COOKIE, value, { path: "/", maxAge: 90 * 24 * 60 * 60, sameSite: "lax" });
  return response;
}

async function track(req: NextRequest, ref: string, visitorId: string, existing: string | undefined): Promise<TrackOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRACK_TIMEOUT_MS);
  try {
    const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
    // The backend filters bots and hashes visitors with the visitor's own user agent.
    headers.set("User-Agent", req.headers.get("user-agent") ?? "");
    applyClientIpHeaders(headers, clientIp(req.headers));
    const response = await fetch(backendUrl("ambassadors/track"), {
      method: "POST",
      headers,
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        ref,
        landingPath: req.nextUrl.pathname.slice(0, 300),
        referrer: req.headers.get("referer")?.slice(0, 500) || undefined,
        utm: utmFrom(req.nextUrl),
        visitorId,
        existing: existing && existing.length <= 1000 ? existing : undefined,
      }),
    });
    return parseTrackResponse(response.status, await response.json().catch(() => null));
  } catch {
    return { kind: "failed" };
  } finally {
    clearTimeout(timer);
  }
}

/** ?ref=<CODE> on any page: record the click, keep the referral in sa_ref, redirect without ref. */
async function handleReferral(req: NextRequest, ref: string): Promise<NextResponse> {
  const cleaned = stripRef(req.nextUrl);
  const target = new URL(`${cleaned.pathname}${cleaned.search}`, `${siteOrigin(req)}/`);
  const response = NextResponse.redirect(target, 307);
  const userAgent = req.headers.get("user-agent");
  if (!isValidRef(ref) || isBot(userAgent)) return response;

  const secure = process.env.NODE_ENV === "production";
  const cookieOptions = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  let visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  if (!isValidVisitorId(visitorId)) {
    visitorId = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, { ...cookieOptions, maxAge: YEAR });
  }

  const existing = req.cookies.get(REF_COOKIE)?.value;
  const decision = refCookieDecision(await track(req, ref, visitorId, existing), ref, existing);
  if (decision) response.cookies.set(REF_COOKIE, decision.value, { ...cookieOptions, maxAge: decision.maxAge });
  return response;
}

export async function middleware(req: NextRequest) {
  const ref = findRef(req.nextUrl);
  if (ref !== null) return handleReferral(req, ref);
  if (req.nextUrl.pathname === "/") return assignExperiment(req);
  return NextResponse.next();
}

export const config = {
  // Every page, so ?ref= works anywhere. Pages without ?ref= pass straight through (the home page
  // also gets its A/B cookie); /_next, /api and static files never reach the middleware.
  matcher: ["/((?!_next/|api/|favicon\\.ico|.*\\.[A-Za-z0-9]+$).*)"],
};
