"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function LogoutButton() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" onClick={logout}>
      Logout
    </Button>
  );
}
