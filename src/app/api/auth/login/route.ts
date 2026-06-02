import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://api.skillsair.com/graphql";
const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";
const WP_ORIGIN = new URL(WP_API).origin;
const WC_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET || "";

const LOGIN_MUTATION = `
  mutation LoginUser($username: String!, $password: String!) {
    login(
      input: {
        clientMutationId: "skillsair-login"
        username: $username
        password: $password
      }
    ) {
      authToken
      user {
        databaseId
        firstName
        lastName
        name
        email
        avatar {
          url
        }
        roles {
          nodes {
            name
          }
        }
      }
    }
  }
`;

interface LoginUser {
  databaseId: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  avatar?: { url?: string };
  roles?: { nodes?: Array<{ name: string }> };
}

interface LoginResult {
  authToken: string;
  user: LoginUser;
  wordpressCookie?: string;
}

interface BackendResult<T> {
  data?: T;
  message?: string;
  status?: number;
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "SkillsAir-NextJS/1.0",
  };
}

function graphQlError(data: Record<string, unknown>): string | undefined {
  const errors = data.errors;
  if (!Array.isArray(errors)) return undefined;
  const first = errors[0] as { message?: string } | undefined;
  return first?.message;
}

function cookieHeader(setCookie: string): string {
  return setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => cookie.trim().split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function loggedInCookie(setCookie: string): string {
  return cookieHeader(setCookie)
    .split("; ")
    .find((cookie) => cookie.startsWith("wordpress_logged_in_")) || "";
}

function inputValue(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`name=["']${escaped}["'][^>]*value=["']([^"']*)["']`, "i"))?.[1] || "";
}

function loginError(html: string): string {
  const match = html.match(/<div id="login_error"[^>]*>([\s\S]*?)<\/div>/i);
  if (!match) return "Invalid email/username or password.";
  return match[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Invalid email/username or password.";
}

function fallbackUser(username: string): LoginUser {
  return {
    databaseId: 0,
    firstName: "",
    lastName: "",
    name: username,
    email: username,
    avatar: { url: "" },
    roles: { nodes: [] },
  };
}

/** Parse a JWT base64url payload without verifying the signature */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Reliable user-ID resolver: call the JWT auth endpoint and parse the
 * WordPress user ID from the token payload.  Works for every user — not just
 * admins — and does not depend on cookie-based REST-API authentication (which
 * requires X-WP-Nonce and therefore cannot be used from the server side).
 */
async function resolveUserViaJwt(username: string, password: string): Promise<LoginUser | null> {
  try {
    const res = await fetchWithTimeout(`${WP_API}/jwt-auth/v1/token`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ username, password }),
    }, 12_000);
    console.log("[DEBUG login] JWT endpoint status:", res.status);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.log("[DEBUG login] JWT failed body:", errBody.slice(0, 300));
      return null;
    }
    const data = await safeJson(res);
    const token = typeof data.token === "string" ? data.token : "";
    console.log("[DEBUG login] JWT token received:", token ? "YES" : "NO");
    if (!token) return null;

    const payload = parseJwtPayload(token) as {
      data?: { user?: { id?: string | number } };
      sub?: string | number;
    } | null;

    console.log("[DEBUG login] JWT payload data.user:", JSON.stringify(payload?.data?.user));
    const userId = Number(payload?.data?.user?.id ?? payload?.sub ?? 0);
    console.log("[DEBUG login] JWT resolved userId:", userId);
    if (!Number.isFinite(userId) || userId <= 0) return null;

    return {
      databaseId: userId,
      firstName: "",
      lastName: "",
      name: typeof data.user_display_name === "string" ? data.user_display_name : username,
      email: typeof data.user_email === "string" ? data.user_email : username,
      avatar: { url: "" },
      roles: { nodes: [] },
    };
  } catch (err) {
    console.log("[DEBUG login] JWT exception:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Admin-only fallback: scrape /wp-admin/profile.php.
 * Non-admin users receive a 302 redirect → this returns null for them.
 */
async function resolveUserFromProfile(cookie: string, username: string): Promise<LoginUser | null> {
  try {
    const res = await fetchWithTimeout(`${WP_ORIGIN}/wp-admin/profile.php`, {
      headers: {
        Cookie: cookie,
        Accept: "text/html",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
      redirect: "manual",
    }, 15_000);
    if (!res.ok) return null;
    const html = await res.text();
    const id = Number(inputValue(html, "checkuser_id"));
    if (!Number.isFinite(id) || id <= 0) return null;
    const firstName = inputValue(html, "first_name");
    const lastName = inputValue(html, "last_name");
    const email = inputValue(html, "email") || username;
    return {
      databaseId: id,
      firstName,
      lastName,
      name: inputValue(html, "display_name") || `${firstName} ${lastName}`.trim() || inputValue(html, "user_login") || username,
      email,
      avatar: { url: "" },
      roles: { nodes: [] },
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the WordPress user for the given credentials.
 *
 * Resolution order:
 *  1. JWT token parsing — works for ALL users (primary fix)
 *  2. Profile-page scraping — works for admins only (kept for resilience)
 *  3. WooCommerce customer lookup by e-mail (covers WC-checkout users)
 *  4. WPGraphQL user search (last resort)
 */
async function resolveUser(username: string, password: string, cookie = ""): Promise<LoginUser> {
  const fallback = fallbackUser(username);

  // 1. JWT — most reliable; works for every user without session cookies or nonces
  const jwtUser = await resolveUserViaJwt(username, password);
  if (jwtUser) {
    console.log("[DEBUG login] resolveUser: JWT succeeded, databaseId:", jwtUser.databaseId);
    return jwtUser;
  }
  console.log("[DEBUG login] resolveUser: JWT returned null, trying profile page...");

  // 2. Profile page scraping (admin-only fallback)
  if (cookie) {
    const profileUser = await resolveUserFromProfile(cookie, username);
    if (profileUser) {
      console.log("[DEBUG login] resolveUser: profile page succeeded, databaseId:", profileUser.databaseId);
      return profileUser;
    }
    console.log("[DEBUG login] resolveUser: profile page returned null, trying WooCommerce...");
  }

  // 3. WooCommerce customer lookup (email logins for WC customers)
  if (username.includes("@")) {
    try {
      // role=all searches ALL WordPress users, not just WooCommerce customers.
      // Without this, users enrolled directly from the WP dashboard are missed.
      const res = await fetch(`${WP_API.replace(/\/$/, "")}/wc/v3/customers?email=${encodeURIComponent(username)}&role=all`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const customers = await res.json().catch(() => []);
      console.log("[DEBUG login] resolveUser: WC customers found (role=all):", Array.isArray(customers) ? customers.length : "not array", Array.isArray(customers) && customers[0] ? `id=${customers[0].id}` : "");
      if (Array.isArray(customers) && typeof customers[0]?.id === "number") {
        console.log("[DEBUG login] resolveUser: WC succeeded, databaseId:", customers[0].id);
        return {
          ...fallback,
          databaseId: customers[0].id,
          firstName: customers[0].first_name || "",
          lastName: customers[0].last_name || "",
          name: `${customers[0].first_name || ""} ${customers[0].last_name || ""}`.trim() || username,
          email: customers[0].email || username,
          avatar: { url: customers[0].avatar_url || "" },
        };
      }
    } catch (err) {
      console.log("[DEBUG login] resolveUser: WC exception:", err instanceof Error ? err.message : err);
    }
  }

  // 4. WPGraphQL user search
  try {
    const res = await fetchWithTimeout(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        query: `query UserSearch($search: String!) { users(where: { search: $search }, first: 1) { nodes { databaseId name } } }`,
        variables: { search: username },
      }),
    }, 10_000);
    const data = await safeJson(res);
    const user = (data.data as { users?: { nodes?: Array<{ databaseId?: number; name?: string }> } } | undefined)
      ?.users?.nodes?.[0];
    if (typeof user?.databaseId === "number") {
      console.log("[DEBUG login] resolveUser: GraphQL succeeded, databaseId:", user.databaseId);
      return {
        ...fallback,
        databaseId: user.databaseId,
        name: user.name || username,
      };
    }
    console.log("[DEBUG login] resolveUser: GraphQL returned no user");
  } catch (err) {
    console.log("[DEBUG login] resolveUser: GraphQL exception:", err instanceof Error ? err.message : err);
  }
  console.log("[DEBUG login] resolveUser: ALL methods failed — returning databaseId: 0");

  return fallback;
}

async function loginViaCoreWordPress(username: string, password: string): Promise<BackendResult<LoginResult>> {
  try {
    const res = await fetchWithTimeout(`${WP_ORIGIN}/wp-login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: "wordpress_test_cookie=WP Cookie check",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
      body: new URLSearchParams({
        log: username,
        pwd: password,
        rememberme: "forever",
        "wp-submit": "Log In",
        redirect_to: `${WP_ORIGIN}/wp-admin/`,
        testcookie: "1",
      }),
      redirect: "manual",
    });

    const setCookie = res.headers.get("set-cookie") || "";
    const wpCookies = cookieHeader(setCookie);
    const wpCookie = loggedInCookie(setCookie);
    const location = res.headers.get("location") || "";
    const success = res.status >= 300 && res.status < 400 && location.includes("/wp-admin") && wpCookie;

    if (!success) {
      return { message: loginError(await res.text()), status: 401 };
    }

    return {
      data: {
        authToken: Buffer.from(`${username}:${Date.now()}:${crypto.randomUUID()}`).toString("base64url"),
        wordpressCookie: wpCookies,
        // Pass the plaintext password so resolveUser can call the JWT endpoint
        user: await resolveUser(username, password, wpCookies),
      },
    };
  } catch (err) {
    return {
      message: err instanceof Error && err.name === "AbortError"
        ? "WordPress login timed out"
        : "WordPress login could not be reached",
      status: 503,
    };
  }
}

async function loginViaGraphql(username: string, password: string): Promise<BackendResult<LoginResult>> {
  try {
    const res = await fetchWithTimeout(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { username, password },
      }),
    });
    const data = await safeJson(res);
    const message = graphQlError(data);
    const login = (data.data as { login?: LoginResult } | undefined)?.login;

    if (!res.ok || message || !login?.authToken) {
      return { message: message || "WPGraphQL login failed", status: res.ok ? 401 : res.status };
    }

    return { data: login };
  } catch (err) {
    return {
      message: err instanceof Error && err.name === "AbortError"
        ? "WPGraphQL login timed out"
        : "WPGraphQL login could not be reached",
      status: 503,
    };
  }
}

async function loginViaJwtRest(username: string, password: string): Promise<BackendResult<LoginResult>> {
  try {
    const res = await fetchWithTimeout(`${WP_API}/jwt-auth/v1/token`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await safeJson(res);
    const token = typeof data.token === "string" ? data.token : "";

    if (!res.ok || !token) {
      return {
        message: typeof data.message === "string" ? data.message : "JWT login failed",
        status: res.ok ? 401 : res.status,
      };
    }

    // Parse the JWT payload to get the WordPress user ID
    const payload = parseJwtPayload(token) as {
      data?: { user?: { id?: string | number } };
      sub?: string | number;
    } | null;
    const userId = Number(payload?.data?.user?.id ?? payload?.sub ?? 0);

    return {
      data: {
        authToken: token,
        user: {
          databaseId: Number.isFinite(userId) && userId > 0 ? userId : 0,
          firstName: "",
          lastName: "",
          name: typeof data.user_display_name === "string" ? data.user_display_name : username,
          email: typeof data.user_email === "string" ? data.user_email : username,
          avatar: { url: "" },
          roles: { nodes: [] },
        },
      },
    };
  } catch (err) {
    return {
      message: err instanceof Error && err.name === "AbortError"
        ? "JWT login timed out"
        : "JWT login could not be reached",
      status: 503,
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ message: "Email/username and password are required" }, { status: 400 });
  }

  const coreLogin = await loginViaCoreWordPress(username, password);
  if (coreLogin.data) {
    const { wordpressCookie, ...payload } = coreLogin.data;
    const response = NextResponse.json(payload);
    if (wordpressCookie) {
      // WordPress session cookie (httpOnly — used by me/route.ts)
      response.cookies.set("sa_wp_auth", Buffer.from(wordpressCookie).toString("base64url"), {
        httpOnly: true,
        secure: req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 14 * 24 * 60 * 60,
      });
    }
    // Cache the resolved user info for the /api/auth/me endpoint so it can
    // serve non-admin users without needing nonce-protected REST API access.
    if (payload.user.databaseId > 0) {
      const userCache = Buffer.from(JSON.stringify({
        id: payload.user.databaseId,
        email: payload.user.email,
        name: payload.user.name,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
      })).toString("base64url");
      response.cookies.set("sa_wp_cache", userCache, {
        httpOnly: true,
        secure: req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 14 * 24 * 60 * 60,
      });
    }
    return response;
  }

  const [graphQlLogin, jwtLogin] = await Promise.all([
    loginViaGraphql(username, password),
    loginViaJwtRest(username, password),
  ]);
  if (graphQlLogin.data) return NextResponse.json(graphQlLogin.data);
  if (jwtLogin.data) return NextResponse.json(jwtLogin.data);

  const unavailable = coreLogin.status === 503 && graphQlLogin.status === 503 && jwtLogin.status === 503;
  return NextResponse.json(
    {
      message: unavailable
        ? "The WordPress login service is unavailable right now. Please try again shortly."
        : coreLogin.message || "Invalid email/username or password.",
    },
    { status: unavailable ? 503 : 401 }
  );
}
