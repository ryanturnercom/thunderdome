import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getClientIP,
  getIPExecutionCount,
  getRemainingExecutions,
  GUEST_EXECUTION_LIMIT,
  getCurrentDateString,
} from "@/lib/guest-rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.isGuest) {
      // Authenticated users have unlimited executions
      return NextResponse.json({
        isGuest: false,
        hasLimit: false,
      });
    }

    const clientIP = getClientIP(request);
    const today = getCurrentDateString();

    // Reset session count if it's a new day
    let sessionCount = session.guestExecutionCount || 0;
    if (session.guestExecutionDate !== today) {
      sessionCount = 0;
    }

    const ipCount = getIPExecutionCount(clientIP);
    const remaining = getRemainingExecutions(sessionCount, ipCount);

    return NextResponse.json({
      isGuest: true,
      hasLimit: true,
      executionLimit: GUEST_EXECUTION_LIMIT,
      executionsUsed: Math.max(sessionCount, ipCount),
      executionsRemaining: remaining,
      limitReached: remaining === 0,
      resetsDaily: true,
    });
  } catch (error) {
    console.error("Guest status error:", error);
    return NextResponse.json(
      { error: "Failed to get guest status" },
      { status: 500 }
    );
  }
}
