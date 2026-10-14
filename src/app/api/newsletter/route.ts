import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
  }

  const response = await backendFetch(req, "newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => null) as
    | { success?: boolean; data?: { subscribed?: boolean }; error?: { message?: string }; message?: string }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      { message: payload?.error?.message || payload?.message || "Newsletter signup is not available right now" },
      { status: response.status }
    );
  }

  return NextResponse.json({ success: payload?.success === true && payload.data?.subscribed === true });
}
