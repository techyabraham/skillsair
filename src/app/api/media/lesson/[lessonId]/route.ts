import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const upstream = await backendFetch(req, `stream/${encodeURIComponent(params.lessonId)}`);
  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("X-Content-Type-Options", "nosniff");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
