import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { LEAD_COOKIE } from "@/lib/lead-session";
import type { Offer } from "@/lib/offer";

/**
 * The personal offer (price, deadline, what's included). Only revealed to an applicant with a
 * lead session or a logged-in learner; everyone else gets 401 and is sent to /apply.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const leadToken = req.cookies.get(LEAD_COOKIE)?.value;
  const upstream = await backendFetch(req, `offers/${encodeURIComponent(params.slug)}`, {
    headers: leadToken ? { Authorization: `Bearer ${leadToken}` } : {},
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "Offers are temporarily unavailable." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as { data?: Offer; error?: { message?: string } } | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json({ message: payload?.error?.message || "Offer unavailable." }, { status: upstream.ok ? 502 : upstream.status });
  }
  return NextResponse.json(payload.data);
}
