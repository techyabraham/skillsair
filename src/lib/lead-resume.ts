import type { NextRequest } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export interface ResumeResult {
  leadToken: string;
  programme: string | null;
}

/** Exchanges a personal /r/<code> resume code for a lead token. Returns null for unknown codes. */
export async function resumeLead(req: NextRequest, code: string): Promise<ResumeResult | null> {
  if (!/^[A-Za-z0-9]{10}$/.test(code)) return null;
  const upstream = await backendFetch(req, `leads/resume/${encodeURIComponent(code)}`).catch(() => null);
  if (!upstream?.ok) return null;
  const payload = (await upstream.json().catch(() => null)) as { data?: ResumeResult } | null;
  return payload?.data?.leadToken ? payload.data : null;
}
