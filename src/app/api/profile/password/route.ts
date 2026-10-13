import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

export async function PATCH(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "You must be signed in to change your password" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const upstream = await backendFetch(req, "profile/password", { method: "POST", body: JSON.stringify(body) });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const message = (payload as { error?: { message?: string }; message?: string }).error?.message
      || (payload as { message?: string }).message
      || "Password change failed";
    return NextResponse.json({ message }, { status: upstream.status });
  }
  return NextResponse.json((payload as { data?: unknown }).data ?? payload);
}
