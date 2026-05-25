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

async function resolveUser(username: string, cookie = ""): Promise<LoginUser> {
  const fallback = fallbackUser(username);
  const profileUser = cookie ? await resolveUserFromProfile(cookie, username) : null;
  if (profileUser) return profileUser;

  if (username.includes("@")) {
    try {
      const res = await fetch(`${WP_API.replace(/\/$/, "")}/wc/v3/customers?email=${encodeURIComponent(username)}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const customers = await res.json().catch(() => []);
      if (Array.isArray(customers) && typeof customers[0]?.id === "number") {
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
    } catch {
      // Fall through to GraphQL lookup.
    }
  }

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
      return {
        ...fallback,
        databaseId: user.databaseId,
        name: user.name || username,
      };
    }
  } catch {
    // Keep the fallback user.
  }

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
        wordpressCookie: wpCookie,
        user: await resolveUser(username, wpCookies),
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

    return {
      data: {
        authToken: token,
        user: {
          databaseId: 0,
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
      response.cookies.set("sa_wp_auth", wordpressCookie, {
        httpOnly: true,
        secure: true,
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
