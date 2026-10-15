import type { NextRequest } from "next/server";

// Production must never silently fall back to an old WordPress/API hostname or
// localhost inside the frontend container. Keep the legacy variable only for
// local development; production has a safe default for the SkillsAir Payload API.
export const BACKEND_ORIGIN = (
  process.env.SKILLSAIR_BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://kiwi.skillsair.com"
    : process.env.BACKEND_API_URL || "http://localhost:3001")
).replace(/\/$/, "");

export function backendUrl(path: string): string {
  return `${BACKEND_ORIGIN}/api/${path.replace(/^\/+/, "")}`;
}

export function backendToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return req.cookies.get("sa_backend_access")?.value || null;
}

export async function backendFetch(
  req: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  let target: URL;
  try {
    target = new URL(BACKEND_ORIGIN);
  } catch {
    return Response.json({ message: "The backend URL is invalid. Set SKILLSAIR_BACKEND_URL to the backend origin." }, { status: 500 });
  }
  if (!(["http:", "https:"].includes(target.protocol)) || target.pathname !== "/" || target.search || target.hash) {
    return Response.json({ message: "SKILLSAIR_BACKEND_URL must be an origin only, for example https://kiwi.skillsair.com." }, { status: 500 });
  }
  if (target.host === req.nextUrl.host) {
    return Response.json({ message: "The frontend is configured to call itself instead of the Payload backend." }, { status: 500 });
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  // Give the API proxy and security layers a stable service identity and the
  // browser-facing origin for requests relayed by this same-origin BFF.
  if (!headers.has("User-Agent")) headers.set("User-Agent", "SkillsAir-Frontend/1.0");
  if (!headers.has("Origin")) headers.set("Origin", req.nextUrl.origin);
  const token = backendToken(req);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const range = req.headers.get("range");
  if (range && !headers.has("Range")) headers.set("Range", range);

  return fetch(backendUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function backendPayload<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as
    | { data?: T; error?: { message?: string }; message?: string }
    | null;
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || payload?.message || `Backend request failed (${response.status})`);
  }
  if (payload && "success" in payload && payload.success === true && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export async function backendError(response: Response): Promise<string> {
  const payload = await response.clone().json().catch(() => null) as
    | { error?: { message?: string }; message?: string }
    | null;
  return payload?.error?.message || payload?.message || `Backend request failed (${response.status})`;
}

export function backendAuthCookieOptions(secure: boolean, maxAge?: number) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}
