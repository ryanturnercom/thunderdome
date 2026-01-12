"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/status");
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      setIsGuest(data.isGuest || false);
    } catch {
      setIsAuthenticated(false);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginAsGuest(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/guest", { method: "POST" });
      if (response.ok) {
        setIsAuthenticated(true);
        setIsGuest(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setIsGuest(false);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isGuest, isLoading, checkAuth, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
