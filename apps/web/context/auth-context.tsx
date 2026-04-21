"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildApiUrl } from "@/lib/api";
import { useUserStore } from "@/stores/user-store";

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  provider: string;
  is_active?: boolean;
  is_email_verified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("ansell_auth_token");
      const storedUser = localStorage.getItem("ansell_auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      localStorage.removeItem("ansell_auth_token");
      localStorage.removeItem("ansell_auth_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    // Clear favourites and preferences from any previously logged-in user
    useUserStore.getState().clearAll();
    localStorage.setItem("ansell_auth_token", newToken);
    localStorage.setItem("ansell_auth_user", JSON.stringify(newUser));
    setCookie("ansell_auth_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    useUserStore.getState().clearAll();
    localStorage.removeItem("ansell_auth_token");
    localStorage.removeItem("ansell_auth_user");
    deleteCookie("ansell_auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const activeToken = token || localStorage.getItem("ansell_auth_token");
    if (!activeToken) return null;
    try {
      const res = await fetch(buildApiUrl("auth/me"), {
        headers: { 
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUser(result.data);
          localStorage.setItem("ansell_auth_user", JSON.stringify(result.data));
          return result.data as AuthUser;
        }
      }
      return null;
    } catch (e) {
      console.error("Failed to refresh user session", e);
      return null;
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
