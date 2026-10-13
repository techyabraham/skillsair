import type { AuthUser } from "@/types/user";

const USER_KEY = "sa_user";
const LEGACY_TOKEN_KEYS = ["sa_token", "sa_token_expiry"];

export function clearLegacyAuthTokens(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  clearLegacyAuthTokens();
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
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, serialized);
    localStorage.removeItem(USER_KEY);
  }
}

export function updateStoredUser(updates: Partial<AuthUser>): AuthUser | null {
  if (typeof window === "undefined") return null;
  const current = getStoredUser();
  if (!current) return null;
  const next = { ...current, ...updates };
  const serialized = JSON.stringify(next);
  if (sessionStorage.getItem(USER_KEY)) {
    sessionStorage.setItem(USER_KEY, serialized);
  }
  if (localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, serialized);
  }
  return next;
}
