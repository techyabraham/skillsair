import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { LEAD_COOKIE } from "@/lib/lead-session";
import type { Offer } from "@/lib/offer";

/**
 * The personal offer (price, deadline, what's included). Only revealed to an applicant with a
 * lead session or a logged-in learner; everyone else gets 401 and is sent to /apply.
 * A signed-in learner's own account decides the price (their locked rate applies at checkout
 * to the account that pays), so the account session wins over a lead cookie on the device;
 * the backend still finds the learner's own application from their account.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const leadToken = req.cookies.get(LEAD_COOKIE)?.value;
  const signedIn = Boolean(req.cookies.get("sa_backend_access")?.value);
  const upstream = await backendFetch(req, `offers/${encodeURIComponent(params.slug)}`, {
    headers: leadToken && !signedIn ? { Authorization: `Bearer ${leadToken}` } : {},
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "Offers are temporarily unavailable." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as { data?: Offer; error?: { message?: string } } | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json({ message: payload?.error?.message || "Offer unavailable." }, { status: upstream.ok ? 502 : upstream.status });
  }
  return NextResponse.json(payload.data);
}
