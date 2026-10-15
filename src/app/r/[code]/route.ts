import { NextRequest, NextResponse } from "next/server";
import { resumeLead } from "@/lib/lead-resume";
import { LEAD_COOKIE, leadCookieOptions } from "@/lib/lead-session";

/**
 * Personal offer link from WhatsApp and email (https://skillsair.com/r/<code>). Opening it
 * on any device restores the applicant's session and lands them on their offer.
 */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const result = await resumeLead(req, params.code);
  if (!result) return NextResponse.redirect(new URL("/apply", req.url));
  const destination = result.programme
    ? `/apply/offer?programme=${encodeURIComponent(result.programme)}`
    : "/apply";
  const response = NextResponse.redirect(new URL(destination, req.url));
  response.cookies.set(LEAD_COOKIE, result.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  return response;
}
