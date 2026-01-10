import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isAuthenticated: session.isAuthenticated,
      authenticatedAt: session.authenticatedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { isAuthenticated: false },
      { status: 500 }
    );
  }
}
