import type { AuthUser } from "@/types/user";

const TOKEN_KEY = "sa_token";
const USER_KEY = "sa_user";
const TOKEN_EXPIRY_KEY = "sa_token_expiry";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string, persistent = false): void {
  if (typeof window === "undefined") return;
  if (persistent) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser, persistent = false): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(user);
  if (persistent) {
    localStorage.setItem(USER_KEY, serialized);
  } else {
    sessionStorage.setItem(USER_KEY, serialized);
  }
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  const expiry =
    sessionStorage.getItem(TOKEN_EXPIRY_KEY) ||
    localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
}

export function setTokenExpiry(expiryMs: number, persistent = false): void {
  if (typeof window === "undefined") return;
  const expiry = String(Date.now() + expiryMs);
  if (persistent) {
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
  } else {
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  if (isTokenExpired()) {
    removeAuthToken();
    return false;
  }
  return true;
}

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}
