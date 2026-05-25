import { NextRequest, NextResponse } from "next/server";

function decodeCookie(value: string): string {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return value;
  }
}

function streamUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["skillsair.com", "api.skillsair.com"].includes(url.hostname)) return null;
    if (url.pathname !== "/wp-admin/admin-ajax.php") return null;
    if (url.searchParams.get("action") !== "igd_stream") return null;
    url.protocol = "https:";
    url.hostname = "api.skillsair.com";
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const target = streamUrl(req.nextUrl.searchParams.get("url") || "");
  if (!target) {
    return NextResponse.json({ message: "Invalid video URL" }, { status: 400 });
  }

  const cookie = req.cookies.get("sa_wp_auth")?.value;
  if (!cookie) {
    return NextResponse.json({ message: "Please log in to watch this lesson." }, { status: 401 });
  }

  const upstream = await fetch(target, {
    headers: {
      Cookie: decodeCookie(cookie),
      Range: req.headers.get("range") || "",
      Referer: "https://api.skillsair.com/",
      Accept: req.headers.get("accept") || "video/mp4,*/*",
      "User-Agent": req.headers.get("user-agent") || "SkillsAir-NextJS/1.0",
    },
    cache: "no-store",
  });

  const headers = new Headers();
  for (const key of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "last-modified",
    "etag",
  ]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (!headers.has("content-type")) headers.set("content-type", "video/mp4");
  headers.set("Access-Control-Allow-Origin", req.nextUrl.origin);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
