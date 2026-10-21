import { NextRequest, NextResponse } from "next/server";
import { resumeLead } from "@/lib/lead-resume";
import { LEAD_COOKIE, leadCookieOptions } from "@/lib/lead-session";
import { siteUrl } from "@/lib/site-origin";

/**
 * Personal offer link from WhatsApp and email (https://skillsair.com/r/<code>). Opening it
 * on any device restores the applicant's session and lands them on their offer.
 */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const result = await resumeLead(req, params.code);
  if (!result) return NextResponse.redirect(siteUrl("/apply", req));
  const destination = result.programme
    ? `/apply/offer?programme=${encodeURIComponent(result.programme)}`
    : "/apply";
  const response = NextResponse.redirect(siteUrl(destination, req));
  response.cookies.set(LEAD_COOKIE, result.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  return response;
}
