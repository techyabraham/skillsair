/**
 * Ambassador referral links (AMBASSADORS.md R6, R7): `?skr=<CODE>` on any page. Legacy `?ref=`
 * links are also accepted. The middleware records the click with the backend, keeps the attribution
 * in the httpOnly `sa_ref` cookie and redirects without either referral parameter.
 */

export const REF_COOKIE = "sa_ref";
export const VISITOR_COOKIE = "sa_vid";

const REF_VALUE = /^[A-Za-z0-9]{1,16}$/;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Link previews and crawlers must not count as clicks (same pattern as the backend). */
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless/i;

/** Fallback when the backend could not be reached: the code alone, kept for 30 days. */
export const FALLBACK_MAX_AGE = 30 * 24 * 60 * 60;

/** Prefer the first `skr` query parameter; accept legacy `ref` links as a fallback. */
export function findRef(url: URL): string | null {
  let skr: string | null = null;
  let legacyRef: string | null = null;
  url.searchParams.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (skr === null && normalizedKey === "skr") skr = value;
    if (legacyRef === null && normalizedKey === "ref") legacyRef = value;
  });
  return skr ?? legacyRef;
}

export function isValidRef(value: string): boolean {
  return REF_VALUE.test(value);
}

export function isValidVisitorId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

/** The same URL without `skr` or legacy `ref` parameters (any case); other parameters are kept. */
export function stripRef(url: URL): URL {
  const out = new URL(url.toString());
  const keys: string[] = [];
  out.searchParams.forEach((_value, key) => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "skr" || normalizedKey === "ref") keys.push(key);
  });
  for (const key of keys) out.searchParams.delete(key);
  return out;
}

export function utmFrom(url: URL): { source?: string; medium?: string; campaign?: string } | undefined {
  const pick = (name: string) => url.searchParams.get(name)?.slice(0, 100) || undefined;
  const utm = { source: pick("utm_source"), medium: pick("utm_medium"), campaign: pick("utm_campaign") };
  return utm.source || utm.medium || utm.campaign ? utm : undefined;
}

export type TrackOutcome =
  | { kind: "tracked"; token: string; maxAgeSeconds: number }
  | { kind: "not_tracked" }
  | { kind: "failed" };

/**
 * What to do with the sa_ref cookie after a track call:
 * tracked -> store the token for maxAgeSeconds; failed (timeout, network, 5xx) -> keep any
 * existing value, else store "code:<REF>" for 30 days; not tracked (unknown or inactive code) ->
 * leave the cookies alone.
 */
export function refCookieDecision(outcome: TrackOutcome, ref: string, existing: string | undefined): { value: string; maxAge: number } | null {
  if (outcome.kind === "tracked") return { value: outcome.token, maxAge: outcome.maxAgeSeconds };
  if (outcome.kind === "failed" && !existing) return { value: `code:${ref.toUpperCase()}`, maxAge: FALLBACK_MAX_AGE };
  return null;
}

/** Reads the backend's track response ({ success, data: { tracked, token, maxAgeSeconds } }). */
export function parseTrackResponse(status: number, body: unknown): TrackOutcome {
  if (status < 200 || status >= 300) return { kind: "failed" };
  const data = (body as { data?: { tracked?: unknown; token?: unknown; maxAgeSeconds?: unknown } } | null)?.data;
  if (!data) return { kind: "failed" };
  if (data.tracked !== true) return { kind: "not_tracked" };
  if (typeof data.token !== "string" || !data.token || data.token.length > 1000) return { kind: "failed" };
  const maxAge = Number(data.maxAgeSeconds);
  return { kind: "tracked", token: data.token, maxAgeSeconds: Number.isInteger(maxAge) && maxAge > 0 ? maxAge : FALLBACK_MAX_AGE };
}
