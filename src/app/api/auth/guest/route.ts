import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    session.isAuthenticated = true;
    session.isGuest = true;
    session.authenticatedAt = Date.now();
    await session.save();

    return NextResponse.json({ success: true, isGuest: true });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "Guest login failed" },
      { status: 500 }
    );
  }
}
