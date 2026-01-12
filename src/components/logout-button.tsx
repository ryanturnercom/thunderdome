"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, DoorOpen } from "lucide-react";

export function LogoutButton() {
  const { isAuthenticated, isGuest, isLoading, logout } = useAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" onClick={logout}>
      {isGuest ? (
        <>
          <DoorOpen className="mr-2 h-4 w-4" />
          Exit
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </>
      )}
    </Button>
  );
}
