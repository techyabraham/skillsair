import { NextRequest, NextResponse } from "next/server";
import { resumeLead } from "@/lib/lead-resume";
import { LEAD_COOKIE, leadCookieOptions } from "@/lib/lead-session";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const result = await resumeLead(req, params.code);
  if (!result) return NextResponse.json({ message: "Offer link not found." }, { status: 404 });
  const response = NextResponse.json({ programme: result.programme });
  response.cookies.set(LEAD_COOKIE, result.leadToken, leadCookieOptions(process.env.NODE_ENV === "production"));
  return response;
}
