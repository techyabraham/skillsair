import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

/**
 * Relays an assessment call to the backend and unwraps its { success, data } envelope. Error codes
 * (CERTIFICATE_PURCHASE_REQUIRED, QUIZ_COOLDOWN, QUIZ_CLOSED…) are passed through for the UI.
 */
export async function relayAssessment(req: NextRequest, path: string, init: RequestInit = {}) {
  if (!backendToken(req)) return NextResponse.json({ message: "Sign in to continue.", code: "AUTH_REQUIRED" }, { status: 401 });
  const upstream = await backendFetch(req, path, init).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "We couldn't reach the server. Check your connection and try again.", code: "NETWORK" }, { status: 502 });
  const body = (await upstream.json().catch(() => null)) as { data?: unknown; error?: { code?: string; message?: string; fields?: Record<string, string> } } | null;
  if (!upstream.ok) {
    return NextResponse.json({ message: body?.error?.message || "Something went wrong. Please try again.", code: body?.error?.code ?? "ERROR", fields: body?.error?.fields }, { status: upstream.status });
  }
  return NextResponse.json(body?.data ?? body ?? {}, { status: upstream.status });
}

export const validId = (value: string) => /^\d+$/.test(value);
