import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

async function forward(req: NextRequest) {
  const path = `graphql${req.nextUrl.search}`;
  const init: RequestInit = { method: req.method };
  if (req.method === "POST") {
    init.body = await req.text();
    const contentType = req.headers.get("content-type");
    if (contentType) init.headers = { "Content-Type": contentType };
  }

  const upstream = await backendFetch(req, path, init);
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "no-store");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

export const GET = forward;
export const POST = forward;
