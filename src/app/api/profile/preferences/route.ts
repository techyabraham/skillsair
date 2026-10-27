import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

/** The learner's remembered player choices (captions, caption size, speed). */
export async function GET(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ preferences: {} });
  const upstream = await backendFetch(req, "profile/preferences");
  if (!upstream.ok) return NextResponse.json({ preferences: {} });
  const data = await backendPayload<{ preferences?: Record<string, unknown> }>(upstream);
  return NextResponse.json({ preferences: data.preferences ?? {} });
}

export async function PATCH(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in to save preferences." }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  if (typeof body.captions === "boolean") allowed.captions = body.captions;
  if (body.captionSize === "s" || body.captionSize === "m" || body.captionSize === "l") allowed.captionSize = body.captionSize;
  if (typeof body.playbackRate === "number" && body.playbackRate >= 0.5 && body.playbackRate <= 2) allowed.playbackRate = body.playbackRate;
  const upstream = await backendFetch(req, "profile/preferences", { method: "PATCH", body: JSON.stringify(allowed) });
  if (!upstream.ok) return NextResponse.json({ message: "Could not save preferences." }, { status: upstream.status });
  const data = await backendPayload<{ preferences?: Record<string, unknown> }>(upstream);
  return NextResponse.json({ preferences: data.preferences ?? {} });
}
