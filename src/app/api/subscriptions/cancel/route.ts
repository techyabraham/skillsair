import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { subscriptionId?: string | number } | null;
  if (!body?.subscriptionId || !/^\d+$/.test(String(body.subscriptionId))) {
    return NextResponse.json({ message: "A valid subscription is required." }, { status: 400 });
  }

  const response = await backendFetch(req, "subscriptions/cancel", {
    method: "POST",
    body: JSON.stringify({ subscriptionId: String(body.subscriptionId) }),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
