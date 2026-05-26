import { NextRequest, NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";
const WP_ORIGIN = new URL(WP_API).origin;

function decodeCookie(value: string): string {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return value;
  }
}

function inputValue(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`name=["']${escaped}["'][^>]*value=["']([^"']*)["']`, "i"))?.[1] || "";
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("sa_wp_auth")?.value;
  if (!cookie) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${WP_ORIGIN}/wp-admin/profile.php`, {
      headers: {
        Cookie: decodeCookie(cookie),
        Accept: "text/html",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json({ message: "Could not refresh WordPress session" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const html = await res.text();
  const id = Number(inputValue(html, "checkuser_id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const firstName = inputValue(html, "first_name");
  const lastName = inputValue(html, "last_name");
  const email = inputValue(html, "email");

  return NextResponse.json({
    user: {
      databaseId: id,
      firstName,
      lastName,
      name: inputValue(html, "display_name") || `${firstName} ${lastName}`.trim() || inputValue(html, "user_login") || email,
      email,
      avatar: { url: "" },
      roles: { nodes: [] },
    },
  });
}
