import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

/** WebVTT captions for a lesson video (same access rules as the video, checked by the backend). */
export async function GET(req: NextRequest, { params }: { params: { lessonId: string; file: string } }) {
  if (!/^\d+$/.test(params.lessonId) || !/^[a-z]{2,3}(-[A-Za-z]{2})?\.vtt$/.test(params.file)) {
    return NextResponse.json({ message: "Captions not found." }, { status: 404 });
  }
  const upstream = await backendFetch(req, `stream/${params.lessonId}/captions/${params.file}`);
  const headers = new Headers();
  for (const name of ["content-type", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("X-Content-Type-Options", "nosniff");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
