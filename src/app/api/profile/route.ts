import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

export async function PATCH(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "You must be signed in to update your profile" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const upstream = await backendFetch(req, "profile/update", { method: "PATCH", body: JSON.stringify(body) });
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = (payload as { error?: { message?: string }; message?: string } | null)?.error?.message
      || (payload as { message?: string } | null)?.message
      || "Profile update failed";
    return NextResponse.json({ message }, { status: upstream.status });
  }
  const userId = req.cookies.get("sa_user_id")?.value;
  if (!userId || !/^\d+$/.test(userId)) {
    return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  const userResponse = await backendFetch(req, `users/${userId}?depth=1`);
  if (!userResponse.ok) {
    return NextResponse.json({ message: "Profile updated, but could not reload your account." }, { status: 502 });
  }
  const userPayload = await userResponse.json().catch(() => null) as {
    data?: { id?: number; firstName?: string; lastName?: string; email?: string; phone?: string; avatar?: { url?: string } | number; role?: string; createdAt?: string };
    id?: number; firstName?: string; lastName?: string; email?: string; phone?: string; avatar?: { url?: string } | number; role?: string; createdAt?: string;
  } | null;
  const user = userPayload?.data ?? userPayload;
  return NextResponse.json({
    id: user?.id ?? Number(userId),
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    displayName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    avatar: typeof user?.avatar === "object" ? user.avatar.url ?? "" : "",
    roles: user?.role ? [user.role] : [],
    registeredAt: user?.createdAt ?? new Date().toISOString(),
  });
}
