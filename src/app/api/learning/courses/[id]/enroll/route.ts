import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await backendFetch(req, `courses/${encodeURIComponent(params.id)}/enroll`, { method: "POST", body: "{}" });
  const body = await response.json().catch(() => ({}));
  return NextResponse.json(body, { status: response.status });
}
