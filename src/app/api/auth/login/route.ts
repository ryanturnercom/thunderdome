import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Constant-time comparison to prevent timing attacks
    const correctPassword = env.authPassword;
    const isValid = password.length === correctPassword.length &&
      password.split("").every((char: string, i: number) => char === correctPassword[i]);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.isAuthenticated = true;
    session.authenticatedAt = Date.now();
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
