import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

/**
 * Email preference centre (signed link from any SkillsAir email; no login).
 * GET ?token=… loads the switches; POST { token, offers?, learningReminders?, unsubscribeAll? } saves them.
 */
const MAX_TOKEN = 400;

async function relay(upstream: Response | null): Promise<NextResponse> {
  const body = (await upstream?.json().catch(() => null)) as { data?: unknown; error?: { message?: string } } | null;
  if (!upstream?.ok) {
    return NextResponse.json(
      { message: body?.error?.message || "We couldn't load your email settings just now. Please try again in a minute." },
      { status: upstream?.status ?? 502 },
    );
  }
  return NextResponse.json(body?.data ?? null);
}

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("token") || "").slice(0, MAX_TOKEN);
  if (!token) return NextResponse.json({ message: "This link is not valid." }, { status: 400 });
  return relay(await backendFetch(req, `email/preferences?token=${encodeURIComponent(token)}`).catch(() => null));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token.slice(0, MAX_TOKEN) : "";
  if (!token) return NextResponse.json({ message: "This link is not valid." }, { status: 400 });
  const pick = (key: string) => (typeof body[key] === "boolean" ? { [key]: body[key] } : {});
  const payload = { token, ...pick("offers"), ...pick("learningReminders"), ...pick("unsubscribeAll") };
  return relay(await backendFetch(req, "email/preferences", { method: "POST", body: JSON.stringify(payload) }).catch(() => null));
}
