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

interface CachedUser {
  id: number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Primary resolver: read the user-info cache that was written at login time.
 *
 * WordPress REST-API cookie auth requires X-WP-Nonce which is unavailable in
 * server-side contexts.  Instead we cache the resolved user in an httpOnly
 * cookie during login and read it back here.
 */
function resolveFromCache(req: NextRequest): CachedUser | null {
  const raw = req.cookies.get("sa_wp_cache")?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CachedUser;
    if (typeof data.id !== "number" || data.id <= 0 || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fallback resolver: scrape /wp-admin/profile.php.
 * Only succeeds for admin users — non-admins get a 302 redirect.
 */
async function resolveViaProfilePage(wpCookie: string): Promise<CachedUser | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${WP_ORIGIN}/wp-admin/profile.php`, {
      headers: {
        Cookie: wpCookie,
        Accept: "text/html",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const id = Number(inputValue(html, "checkuser_id"));
    if (!Number.isFinite(id) || id <= 0) return null;
    const firstName = inputValue(html, "first_name");
    const lastName = inputValue(html, "last_name");
    return {
      id,
      firstName,
      lastName,
      name: inputValue(html, "display_name") || `${firstName} ${lastName}`.trim() || inputValue(html, "user_login"),
      email: inputValue(html, "email"),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  // Must have some form of authentication cookie
  const authCookie = req.cookies.get("sa_wp_auth")?.value;
  if (!authCookie) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // 1. Try the user-info cache written at login time (works for all users)
  let user = resolveFromCache(req);

  // 2. Fallback: profile.php scraping (works only for admins)
  if (!user) {
    const wpCookie = decodeCookie(authCookie);
    user = await resolveViaProfilePage(wpCookie);
  }

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  return NextResponse.json({
    user: {
      databaseId: user.id,
      firstName,
      lastName,
      name: user.name || `${firstName} ${lastName}`.trim() || user.email,
      email: user.email,
      avatar: { url: "" },
      roles: { nodes: [] },
    },
  });
}
