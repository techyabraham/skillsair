import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const response = await backendFetch(req, "auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
