import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";
import { LEAD_COOKIE } from "@/lib/lead-session";

/**
 * One-tap waitlist join from a quiz result. Sends the applicant cookie (or, failing that, the
 * account session) so the backend can check this is the person who took the quiz.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[A-Za-z0-9_-]{16,32}$/.test(params.id)) return NextResponse.json({ message: "Result not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const career = typeof body.career === "string" ? body.career.slice(0, 40) : "";
  if (!career) return NextResponse.json({ message: "Choose a career." }, { status: 400 });
  const leadToken = req.cookies.get(LEAD_COOKIE)?.value;
  const upstream = await backendFetch(req, `quiz-results/public/${encodeURIComponent(params.id)}/waitlist`, {
    method: "POST",
    headers: leadToken ? { Authorization: `Bearer ${leadToken}` } : {},
    body: JSON.stringify({ career }),
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "Something went wrong on our side. Please try again." }, { status: 502 });
  const payload = (await upstream.json().catch(() => null)) as { data?: { waitlisted?: boolean }; error?: { message?: string } } | null;
  if (!upstream.ok || !payload?.data) {
    return NextResponse.json({ message: payload?.error?.message || "Something went wrong on our side. Please try again." }, { status: upstream.ok ? 502 : upstream.status });
  }
  return NextResponse.json({ waitlisted: true });
}
