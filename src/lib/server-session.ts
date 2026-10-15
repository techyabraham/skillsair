import { cookies, headers } from "next/headers";
import { serverBackendFetch } from "@/lib/backend-api";
import { LEAD_COOKIE } from "@/lib/lead-session";
import type { Offer } from "@/lib/offer";

/** Lead token first (it carries the applicant's answers), then the account session. */
export function sessionToken(): string | null {
  const store = cookies();
  return store.get(LEAD_COOKIE)?.value || store.get("sa_backend_access")?.value || null;
}

export function hasAccountSession(): boolean {
  return Boolean(cookies().get("sa_backend_access")?.value);
}

export type OfferResult = { status: "ok"; offer: Offer } | { status: "unauthorised" } | { status: "not_found" } | { status: "error" };

export async function fetchOffer(slug: string): Promise<OfferResult> {
  const token = sessionToken();
  if (!token) return { status: "unauthorised" };
  const response = await serverBackendFetch(`offers/${encodeURIComponent(slug)}`, { token, requestHeaders: headers() }).catch(() => null);
  if (!response) return { status: "error" };
  if (response.status === 401) {
    // A stale lead cookie should not hide a valid account session.
    const account = cookies().get("sa_backend_access")?.value;
    if (account && account !== token) {
      const retry = await serverBackendFetch(`offers/${encodeURIComponent(slug)}`, { token: account, requestHeaders: headers() }).catch(() => null);
      if (retry?.ok) {
        const payload = (await retry.json()) as { data: Offer };
        return { status: "ok", offer: payload.data };
      }
    }
    return { status: "unauthorised" };
  }
  if (response.status === 404) return { status: "not_found" };
  if (!response.ok) return { status: "error" };
  const payload = (await response.json().catch(() => null)) as { data?: Offer } | null;
  return payload?.data ? { status: "ok", offer: payload.data } : { status: "error" };
}

/** Records an offer view for scoring. Best effort; never blocks the page. */
export async function recordOfferView(): Promise<void> {
  const token = sessionToken();
  if (!token) return;
  await serverBackendFetch("leads/me", {
    token,
    requestHeaders: headers(),
    init: { method: "PATCH", body: JSON.stringify({ event: "offer_viewed" }) },
  }).catch(() => null);
}
