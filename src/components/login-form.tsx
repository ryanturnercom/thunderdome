"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { User, UserCheck } from "lucide-react";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const router = useRouter();
  const { loginAsGuest } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Access Granted", {
          description: "Welcome to the Thunderdome",
        });
        router.push("/");
        router.refresh();
      } else {
        toast.error("Access Denied", {
          description: data.error || "Invalid password",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Failed to authenticate",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuestLogin() {
    setIsGuestLoading(true);
    try {
      const success = await loginAsGuest();
      if (success) {
        toast.success("Welcome, Guest!", {
          description: "Browse saved configurations",
        });
        router.push("/");
        router.refresh();
      } else {
        toast.error("Error", {
          description: "Failed to enter as guest",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Failed to enter as guest",
      });
    } finally {
      setIsGuestLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md thunderdome-panel">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl thunderdome-header">ENTER THE ARENA</CardTitle>
        <CardDescription>Provide the password to gain access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full thunderdome-button" disabled={isLoading || isGuestLoading}>
            <UserCheck className="mr-2 h-4 w-4" />
            {isLoading ? "Authenticating..." : "Enter as Admin"}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGuestLogin}
          disabled={isLoading || isGuestLoading}
        >
          <User className="mr-2 h-4 w-4" />
          {isGuestLoading ? "Entering..." : "Enter as Guest"}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Guests can view saved configurations but cannot execute prompts
        </p>
      </CardContent>
    </Card>
  );
}
