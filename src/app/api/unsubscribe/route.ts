import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

/** One-click unsubscribe from marketing (token comes from the email link). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof body.token === "string" ? body.token.slice(0, 200) : "";
  if (!token) return NextResponse.json({ message: "This unsubscribe link is not valid." }, { status: 400 });
  const upstream = await backendFetch(req, "leads/unsubscribe", { method: "POST", body: JSON.stringify({ token }) }).catch(() => null);
  if (!upstream?.ok) {
    const payload = (await upstream?.json().catch(() => null)) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: payload?.error?.message || "We couldn't process that just now." }, { status: upstream?.status ?? 502 });
  }
  return NextResponse.json({ unsubscribed: true });
}
