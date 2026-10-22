import type { NextRequest } from "next/server";

/**
 * The public site origin (https://skillsair.com) for redirects and absolute links built on the
 * server. Behind Coolify's proxy, `req.url` / `req.nextUrl.origin` is the container's own
 * address (https://0.0.0.0:3000), so it is only a fallback for local development.
 */
export function siteOrigin(req: NextRequest): string {
  const fallback = process.env.NODE_ENV === "production" ? "https://skillsair.com" : req.nextUrl.origin;
  return (process.env.NEXT_PUBLIC_SITE_URL || fallback).replace(/\/+$/, "");
}

/** An absolute URL on the public site for a path such as "/apply". */
export function siteUrl(path: string, req: NextRequest): URL {
  return new URL(path, `${siteOrigin(req)}/`);
}
