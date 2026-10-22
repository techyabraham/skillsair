import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

/** A lesson document kept in Google Drive, streamed by the backend after its access check. */
export async function GET(req: NextRequest, { params }: { params: { lessonId: string; index: string } }) {
  if (!/^\d+$/.test(params.lessonId) || !/^\d+$/.test(params.index)) {
    return NextResponse.json({ message: "Invalid lesson resource." }, { status: 400 });
  }
  const upstream = await backendFetch(req, `stream/${params.lessonId}/resources/${params.index}`);
  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("X-Content-Type-Options", "nosniff");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
