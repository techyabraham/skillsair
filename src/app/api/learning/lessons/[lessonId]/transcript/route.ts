import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

export interface TranscriptLine {
  start: number;
  text: string;
}

/** A lesson's transcript as timestamped lines (same access rules as the video). */
export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  if (!/^\d+$/.test(params.lessonId)) return NextResponse.json({ message: "Lesson not found." }, { status: 404 });
  const upstream = await backendFetch(req, `lessons/${params.lessonId}/transcript`);
  if (!upstream.ok) {
    const body = await upstream.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Transcript unavailable." }, { status: upstream.status });
  }
  const data = await backendPayload<{ lines?: TranscriptLine[] }>(upstream);
  return NextResponse.json({ lines: data.lines ?? [] });
}
