"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { refreshAccessToken } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/token-store";
import type { LoginRequest, RegisterRequest, UserResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  user: UserResponse | null;
  status: AuthStatus;
  isAdmin: boolean;
  login: (payload: LoginRequest) => Promise<UserResponse>;
  register: (payload: RegisterRequest) => Promise<UserResponse>;
  logout: () => Promise<void>;
  /** Replaces the cached user, for example after a profile update. */
  setUser: (user: UserResponse) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Restore the session from the refresh cookie once on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        setStatus("anonymous");
        return;
      }
      try {
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The client clears the token when a refresh fails, which means the session is over.
  useEffect(
    () =>
      tokenStore.subscribe((token) => {
        if (token === null) {
          setUser(null);
          setStatus("anonymous");
          queryClient.removeQueries({ queryKey: queryKeys.cart.all });
          queryClient.removeQueries({ queryKey: queryKeys.orders.all });
          queryClient.removeQueries({ queryKey: queryKeys.profile.all });
        }
      }),
    [queryClient],
  );

  const login = useCallback(async (payload: LoginRequest) => {
    const result = await authApi.login(payload);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const result = await authApi.register(payload);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
      queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      queryClient.removeQueries({ queryKey: queryKeys.orders.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAdmin: user?.role === "ADMIN", login, register, logout, setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
