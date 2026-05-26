"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  setAuthToken,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
  setTokenExpiry,
  isAuthenticated as checkAuth,
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

function toAuthUser(data: Record<string, unknown>, fallbackToken: string): AuthUser {
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
    throw new Error("WordPress returned an unexpected user response.");
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
    token: typeof data.authToken === "string" ? data.authToken : fallbackToken,
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
    const storedUser = getStoredUser();
    const authenticated = checkAuth();
    setState({
      user: authenticated && storedUser ? storedUser : null,
      isAuthenticated: authenticated && !!storedUser,
      isLoading: false,
      error: null,
    });

    if (authenticated && storedUser) {
      fetch("/api/auth/me")
        .then(async (res) => {
          if (!res.ok) return null;
          return safeJson(res);
        })
        .then((data) => {
          if (!data) return;
          const refreshedUser = toAuthUser(data, storedUser.token);
          const persistent = Boolean(localStorage.getItem("sa_user"));
          setStoredUser(refreshedUser, persistent);
          setState({ user: refreshedUser, isAuthenticated: true, isLoading: false, error: null });
        })
        .catch(() => undefined);
    }
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
        }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(typeof data.message === "string" ? data.message : "Login failed");
      }

      const authToken = typeof data.authToken === "string" ? data.authToken : "";
      if (!authToken) {
        throw new Error("Login returned an unexpected response from WordPress.");
      }
      const authUser = toAuthUser(data, authToken);

      const persistent = credentials.rememberMe ?? false;
      setAuthToken(authToken, persistent);
      setStoredUser(authUser, persistent);
      setTokenExpiry(7 * 24 * 60 * 60 * 1000, persistent);

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
        }),
      });
      const result = await safeJson(res);
      if (!res.ok) {
        throw new Error(typeof result.message === "string" ? result.message : "Registration failed");
      }
      await login({ username: data.email, password: data.password });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, [login]);

  const logout = useCallback(() => {
    removeAuthToken();
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  }, []);

  const refreshUser = useCallback(() => {
    const storedUser = getStoredUser();
    const authenticated = checkAuth();
    setState((prev) => ({
      ...prev,
      user: authenticated && storedUser ? storedUser : null,
      isAuthenticated: authenticated && !!storedUser,
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
