import { NextRequest, NextResponse } from "next/server";
import { backendAuthCookieOptions, backendFetch, backendPayload } from "@/lib/backend-api";

interface BackendLogin {
  authToken: string;
  refreshToken: string;
  user: { id: number; email: string; firstName?: string; lastName?: string; role?: string };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { username?: unknown; password?: unknown; rememberMe?: unknown };
  const email = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ message: "Email and password are required" }, { status: 400 });

  try {
    // Never leave the sign-in button spinning: if the API doesn't answer, say so.
    const upstream = await backendFetch(req, "auth/login", { method: "POST", body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(25_000) });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null) as { error?: { message?: string } } | null;
      return NextResponse.json({ message: payload?.error?.message || "Login failed" }, { status: upstream.status });
    }
    const result = await backendPayload<BackendLogin>(upstream);
    const user = result.user;
    const rememberMe = body.rememberMe === true;
    const persistentAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
    const response = NextResponse.json({
      user: {
        databaseId: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        email: user.email,
        avatar: { url: "" },
        roles: { nodes: [{ name: user.role || "student" }] },
      },
    });
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("sa_backend_access", result.authToken, backendAuthCookieOptions(secure, rememberMe ? 7 * 24 * 60 * 60 : undefined));
    response.cookies.set("sa_backend_refresh", result.refreshToken, backendAuthCookieOptions(secure, persistentAge));
    response.cookies.set("sa_user_id", String(user.id), backendAuthCookieOptions(secure, persistentAge));
    if (rememberMe) response.cookies.set("sa_persistent", "1", backendAuthCookieOptions(secure, persistentAge));
    else response.cookies.delete("sa_persistent");
    return response;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ message: "Sign-in is taking too long. Please try again in a minute." }, { status: 504 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Backend login service is unavailable" }, { status: 502 });
  }
}
