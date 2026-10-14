import { NextResponse } from "next/server";
import { BACKEND_ORIGIN } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET() {
  let backendStatus: number | null = null;
  let backendOk = false;
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    backendStatus = response.status;
    const payload = await response.json().catch(() => null) as { status?: string } | null;
    backendOk = response.ok && payload?.status === "ok";
  } catch {
    backendStatus = null;
  }

  return NextResponse.json({
    ok: backendOk,
    service: "skillsair-frontend",
    backend: {
      configured: Boolean(process.env.SKILLSAIR_BACKEND_URL || process.env.BACKEND_API_URL),
      reachable: backendStatus !== null,
      status: backendStatus,
    },
    timestamp: new Date().toISOString(),
  });
}
