"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  clearLegacyAuthTokens,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth";
import type { AuthUser, AuthState, LoginCredentials, RegisterData } from "@/types/user";

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

function toAuthUser(data: Record<string, unknown>): AuthUser {
  const user = data.user as {
    databaseId?: number;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    avatar?: { url?: string };
    roles?: { nodes?: Array<{ name: string }> };
  } | undefined;

  if (!user?.email) {
    throw new Error("SkillsAir returned an unexpected user response.");
  }

  return {
    id: user.databaseId ?? 0,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
    email: user.email,
    avatar: user.avatar?.url || "",
    roles: user.roles?.nodes?.map((r: { name: string }) => r.name) ?? [],
    registeredAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    clearLegacyAuthTokens();
    let cancelled = false;
    const persistent = Boolean(localStorage.getItem("sa_user"));
    const syncUser = async () => {
      try {
        let response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401) {
          const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
          if (refreshed.ok) response = await fetch("/api/auth/me", { cache: "no-store" });
        }
        if (!response.ok) throw new Error("Session expired");
        const data = await safeJson(response);
        const user = toAuthUser(data);
        if (cancelled) return;
        setStoredUser(user, persistent);
        setState({ user, isAuthenticated: true, isLoading: false, error: null });
      } catch {
        if (cancelled) return;
        removeAuthToken();
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    };
    void syncUser();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe ?? false,
        }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(typeof data.message === "string" ? data.message : "Login failed");
      }

      const authUser = toAuthUser(data);

      const persistent = credentials.rememberMe ?? false;
      setStoredUser(authUser, persistent);

      setState({ user: authUser, isAuthenticated: true, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          marketingConsent: data.marketingConsent === true,
          marketingConsentText: data.marketingConsent ? data.marketingConsentText : undefined,
        }),
      });
      const result = await safeJson(res);
      if (!res.ok) {
        throw new Error(typeof result.message === "string" ? result.message : "Registration failed");
      }
      const authUser = toAuthUser(result);
      setStoredUser(authUser);
      setState({ user: authUser, isAuthenticated: true, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST" });
    removeAuthToken();
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  }, []);

  const refreshUser = useCallback(() => {
    const storedUser = getStoredUser();
    setState((prev) => ({
      ...prev,
      user: storedUser,
      isAuthenticated: !!storedUser,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
