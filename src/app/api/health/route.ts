import { NextResponse } from "next/server";
import { BACKEND_ORIGIN } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET() {
  let backendStatus: number | null = null;
  let backendOk = false;
  let backendHost: string | null = null;
  try {
    backendHost = new URL(BACKEND_ORIGIN).host;
    const response = await fetch(`${BACKEND_ORIGIN}/health`, {
      headers: {
        Accept: "application/json",
        Origin: process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com",
        "User-Agent": "SkillsAir-Frontend/1.0",
      },
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
      configured: Boolean(process.env.SKILLSAIR_BACKEND_URL) || process.env.NODE_ENV === "production",
      host: backendHost,
      reachable: backendStatus !== null,
      status: backendStatus,
    },
    timestamp: new Date().toISOString(),
  });
}
