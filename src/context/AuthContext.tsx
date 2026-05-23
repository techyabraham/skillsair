"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_USER, REGISTER_USER } from "@/graphql/mutations/auth";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [loginMutation] = useMutation(LOGIN_USER);
  const [registerMutation] = useMutation(REGISTER_USER);

  useEffect(() => {
    const storedUser = getStoredUser();
    const authenticated = checkAuth();
    setState({
      user: authenticated && storedUser ? storedUser : null,
      isAuthenticated: authenticated && !!storedUser,
      isLoading: false,
      error: null,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data } = await loginMutation({
        variables: {
          username: credentials.username,
          password: credentials.password,
        },
      });

      const { authToken, user } = data.login;
      const authUser: AuthUser = {
        id: user.databaseId,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar?.url || "",
        roles: user.roles.nodes.map((r: { name: string }) => r.name),
        registeredAt: new Date().toISOString(),
        token: authToken,
      };

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
  }, [loginMutation]);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await registerMutation({
        variables: {
          username: data.email,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
      await login({ username: data.email, password: data.password });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, [registerMutation, login]);

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
