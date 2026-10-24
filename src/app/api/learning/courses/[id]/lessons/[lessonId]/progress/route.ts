import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; lessonId: string } },
) {
  const body = await req.json().catch(() => ({})) as { watchedSeconds?: number; duration?: number; isCompleted?: boolean };
  const response = await backendFetch(
    req,
    `courses/${encodeURIComponent(params.id)}/lessons/${encodeURIComponent(params.lessonId)}/progress`,
    {
      method: "POST",
      body: JSON.stringify({
        watchedSeconds: Math.max(0, Number(body.watchedSeconds ?? body.duration ?? 0)),
        // false = a player heartbeat (watch time only); anything else marks the lesson complete.
        isCompleted: body.isCompleted !== false,
      }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
