import { NextRequest, NextResponse } from "next/server";
import { backendAuthCookieOptions, backendFetch, backendPayload } from "@/lib/backend-api";

interface BackendRegistration {
  authToken: string;
  refreshToken: string;
  user: { id: number; email: string; firstName?: string; lastName?: string; role?: string };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ message: "First name, last name, email, and password are required" }, { status: 400 });
  }

  const normalizedPhone = phone
    ? phone.startsWith("+") ? phone : phone.startsWith("0") ? `+234${phone.slice(1)}` : `+${phone}`
    : "";
  if (normalizedPhone && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
    return NextResponse.json({ message: "Enter a valid phone number with country code." }, { status: 400 });
  }

  try {
    const upstream = await backendFetch(req, "auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName, ...(normalizedPhone ? { phone: normalizedPhone } : {}) }),
    });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null) as { error?: { message?: string; fields?: Record<string, string> } } | null;
      return NextResponse.json({ message: payload?.error?.message || "Registration failed", fields: payload?.error?.fields }, { status: upstream.status });
    }
    const result = await backendPayload<BackendRegistration>(upstream);
    const response = NextResponse.json({
      user: {
        databaseId: result.user.id,
        firstName: result.user.firstName || firstName,
        lastName: result.user.lastName || lastName,
        name: `${result.user.firstName || firstName} ${result.user.lastName || lastName}`.trim(),
        email: result.user.email,
        avatar: { url: "" },
        roles: { nodes: [{ name: result.user.role || "student" }] },
      },
    }, { status: 201 });
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("sa_backend_access", result.authToken, backendAuthCookieOptions(secure));
    response.cookies.set("sa_backend_refresh", result.refreshToken, backendAuthCookieOptions(secure));
    response.cookies.set("sa_user_id", String(result.user.id), backendAuthCookieOptions(secure));
    response.cookies.delete("sa_persistent");
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Backend registration service is unavailable" }, { status: 502 });
  }
}
