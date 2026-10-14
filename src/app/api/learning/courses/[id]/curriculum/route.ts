import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await backendFetch(req, `courses/${encodeURIComponent(params.id)}/curriculum`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load course outline." }, { status: response.status });
  }
  const payload = await backendPayload<{ sections?: unknown[] }>(response);
  return NextResponse.json(payload.sections || []);
}
