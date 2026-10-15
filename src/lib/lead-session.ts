/**
 * The applicant ("lead") session. The backend issues a lead token when someone completes
 * Apply step 2; it is kept server-side in an HttpOnly cookie, like the account session.
 * A lead token only unlocks the applicant's own offer; it is never a login.
 */

export const LEAD_COOKIE = "sa_lead";
export const ATTRIBUTION_COOKIE = "sa_attr";
export const LEAD_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function leadCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: LEAD_COOKIE_MAX_AGE,
  };
}

export interface Attribution {
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
  referrer?: string;
  landingPath?: string;
}

/** Reads the first-party first-touch attribution cookie written by AttributionCapture. */
export function parseAttribution(raw: string | undefined): Attribution {
  if (!raw) return {};
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Attribution;
    const text = (input: unknown, max: number) => (typeof input === "string" ? input.slice(0, max) : undefined);
    const utm = value.utm ?? {};
    return {
      utm: {
        source: text(utm.source, 200),
        medium: text(utm.medium, 200),
        campaign: text(utm.campaign, 200),
        content: text(utm.content, 200),
        term: text(utm.term, 200),
      },
      referrer: text(value.referrer, 500),
      landingPath: text(value.landingPath, 500),
    };
  } catch {
    return {};
  }
}

/** Only same-site paths are allowed as post-login/registration destinations. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
