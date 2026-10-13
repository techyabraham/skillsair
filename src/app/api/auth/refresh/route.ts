import { NextRequest, NextResponse } from "next/server";
import { backendAuthCookieOptions, backendFetch, backendPayload } from "@/lib/backend-api";

interface Tokens { authToken: string; refreshToken: string }

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("sa_backend_refresh")?.value;
  if (!refreshToken) return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
  const upstream = await backendFetch(req, "auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!upstream.ok) {
    const body = await upstream.json().catch(() => null) as { error?: { message?: string } } | null;
    const response = NextResponse.json({ message: body?.error?.message || "Your session has expired. Please sign in again." }, { status: upstream.status });
    response.cookies.delete("sa_backend_access");
    response.cookies.delete("sa_backend_refresh");
    response.cookies.delete("sa_user_id");
    response.cookies.delete("sa_persistent");
    return response;
  }
  const tokens = await backendPayload<Tokens>(upstream);
  const persistent = req.cookies.get("sa_persistent")?.value === "1";
  const persistentAge = persistent ? 30 * 24 * 60 * 60 : undefined;
  const response = NextResponse.json({ refreshed: true });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("sa_backend_access", tokens.authToken, backendAuthCookieOptions(secure, persistent ? 7 * 24 * 60 * 60 : undefined));
  response.cookies.set("sa_backend_refresh", tokens.refreshToken, backendAuthCookieOptions(secure, persistentAge));
  return response;
}
