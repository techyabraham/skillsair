import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "You must be signed in to upload an avatar" }, { status: 401 });
  const formData = await req.formData();
  const upstream = await backendFetch(req, "profile/avatar", { method: "POST", body: formData });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const message = (payload as { error?: { message?: string }; message?: string }).error?.message
      || (payload as { message?: string }).message
      || "Avatar upload failed";
    return NextResponse.json({ message }, { status: upstream.status });
  }
  return NextResponse.json((payload as { data?: unknown }).data ?? payload);
}
