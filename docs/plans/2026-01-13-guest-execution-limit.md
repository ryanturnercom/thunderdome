# Guest Execution Limit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limit guest users to 5 executions using a hybrid session + IP tracking approach.

**Architecture:** Store execution count in session cookie (primary) with IP-based server-side backup (fallback). When either limit is reached, block execution and show guest limit message. Authenticated (non-guest) users bypass all limits.

**Tech Stack:** iron-session (existing), Node.js Map for IP storage (in-memory, resets on server restart), Next.js API routes

---

## Task 1: Extend Session Type with Execution Count

**Files:**
- Modify: `src/types/auth.ts`

**Step 1: Add guestExecutionCount to SessionData interface**

In `src/types/auth.ts`, update the interface:

```typescript
export interface SessionData {
  isAuthenticated: boolean;
  isGuest?: boolean;
  authenticatedAt?: number;
  guestExecutionCount?: number;  // Add this line
}

export const defaultSession: SessionData = {
  isAuthenticated: false,
  isGuest: false,
};
```

**Step 2: Commit**

```bash
git add src/types/auth.ts
git commit -m "feat: add guestExecutionCount to session type"
```

---

## Task 2: Create IP-Based Rate Limit Store

**Files:**
- Create: `src/lib/guest-rate-limit.ts`

**Step 1: Create the rate limit store module**

Create `src/lib/guest-rate-limit.ts`:

```typescript
// In-memory store for IP-based guest execution tracking
// Resets on server restart - provides basic protection against cookie clearing

const GUEST_EXECUTION_LIMIT = 5;
const IP_STORE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface IPRecord {
  count: number;
  firstSeen: number;
}

// In-memory store - for production, consider Redis
const ipStore = new Map<string, IPRecord>();

// Cleanup expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now - record.firstSeen > IP_STORE_TTL_MS) {
      ipStore.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

export function getIPExecutionCount(ip: string): number {
  const record = ipStore.get(ip);
  if (!record) return 0;

  // Check if expired
  if (Date.now() - record.firstSeen > IP_STORE_TTL_MS) {
    ipStore.delete(ip);
    return 0;
  }

  return record.count;
}

export function incrementIPExecutionCount(ip: string): number {
  const existing = ipStore.get(ip);

  if (existing && Date.now() - existing.firstSeen <= IP_STORE_TTL_MS) {
    existing.count += 1;
    return existing.count;
  }

  // New record or expired
  ipStore.set(ip, { count: 1, firstSeen: Date.now() });
  return 1;
}

export function isGuestLimitExceeded(sessionCount: number, ipCount: number): boolean {
  // Block if EITHER session or IP limit is reached
  return sessionCount >= GUEST_EXECUTION_LIMIT || ipCount >= GUEST_EXECUTION_LIMIT;
}

export function getRemainingExecutions(sessionCount: number, ipCount: number): number {
  const maxUsed = Math.max(sessionCount, ipCount);
  return Math.max(0, GUEST_EXECUTION_LIMIT - maxUsed);
}

export { GUEST_EXECUTION_LIMIT };
```

**Step 2: Commit**

```bash
git add src/lib/guest-rate-limit.ts
git commit -m "feat: add IP-based guest rate limit store"
```

---

## Task 3: Create Helper to Extract Client IP

**Files:**
- Modify: `src/lib/guest-rate-limit.ts`

**Step 1: Add IP extraction helper**

Add this function to `src/lib/guest-rate-limit.ts` (at the top, after the imports area):

```typescript
import { NextRequest } from "next/server";

export function getClientIP(request: NextRequest): string {
  // Check common headers for real IP (behind proxy/load balancer)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // Fallback - may not work in all environments
  return request.headers.get("x-client-ip") || "unknown";
}
```

**Step 2: Commit**

```bash
git add src/lib/guest-rate-limit.ts
git commit -m "feat: add client IP extraction helper"
```

---

## Task 4: Add Guest Limit Check to Execute Route

**Files:**
- Modify: `src/app/api/execute/route.ts`

**Step 1: Import rate limit functions**

At the top of `src/app/api/execute/route.ts`, add:

```typescript
import {
  getClientIP,
  getIPExecutionCount,
  incrementIPExecutionCount,
  isGuestLimitExceeded,
  getRemainingExecutions,
  GUEST_EXECUTION_LIMIT,
} from "@/lib/guest-rate-limit";
```

**Step 2: Add guest limit check after auth check**

In `src/app/api/execute/route.ts`, after the authentication check (around line 13), add:

```typescript
  // Check guest execution limit
  if (session.isGuest) {
    const clientIP = getClientIP(request);
    const sessionCount = session.guestExecutionCount || 0;
    const ipCount = getIPExecutionCount(clientIP);

    if (isGuestLimitExceeded(sessionCount, ipCount)) {
      return new Response(
        JSON.stringify({
          error: "Guest limit reached",
          message: `You have reached the limit of ${GUEST_EXECUTION_LIMIT} executions as a guest. Please log in to continue.`,
          isGuestLimitError: true,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
```

**Step 3: Increment counts after successful execution start**

After the `completionPromises` array is created and all models are queued (around line 133, before `await Promise.all`), add:

```typescript
      // Increment guest execution counts (do this BEFORE waiting for completion)
      if (session.isGuest) {
        const clientIP = getClientIP(request);
        session.guestExecutionCount = (session.guestExecutionCount || 0) + 1;
        await session.save();
        incrementIPExecutionCount(clientIP);
      }
```

**Step 4: Commit**

```bash
git add src/app/api/execute/route.ts
git commit -m "feat: enforce guest execution limit in execute route"
```

---

## Task 5: Initialize Guest Execution Count on Login

**Files:**
- Modify: `src/app/api/auth/guest/route.ts`

**Step 1: Initialize guestExecutionCount to 0**

Update `src/app/api/auth/guest/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    session.isAuthenticated = true;
    session.isGuest = true;
    session.authenticatedAt = Date.now();
    session.guestExecutionCount = 0;  // Add this line
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
```

**Step 2: Commit**

```bash
git add src/app/api/auth/guest/route.ts
git commit -m "feat: initialize guest execution count on guest login"
```

---

## Task 6: Add API Endpoint to Check Remaining Executions

**Files:**
- Create: `src/app/api/auth/guest-status/route.ts`

**Step 1: Create guest status endpoint**

Create `src/app/api/auth/guest-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getClientIP,
  getIPExecutionCount,
  getRemainingExecutions,
  GUEST_EXECUTION_LIMIT,
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
    const sessionCount = session.guestExecutionCount || 0;
    const ipCount = getIPExecutionCount(clientIP);
    const remaining = getRemainingExecutions(sessionCount, ipCount);

    return NextResponse.json({
      isGuest: true,
      hasLimit: true,
      executionLimit: GUEST_EXECUTION_LIMIT,
      executionsUsed: Math.max(sessionCount, ipCount),
      executionsRemaining: remaining,
      limitReached: remaining === 0,
    });
  } catch (error) {
    console.error("Guest status error:", error);
    return NextResponse.json(
      { error: "Failed to get guest status" },
      { status: 500 }
    );
  }
}
```

**Step 2: Add route to public routes in middleware**

Update `src/middleware.ts` line 7:

```typescript
const publicRoutes = ["/login", "/api/auth/login", "/api/auth/guest", "/api/auth/status", "/api/auth/logout", "/api/auth/guest-status"];
```

**Step 3: Commit**

```bash
git add src/app/api/auth/guest-status/route.ts src/middleware.ts
git commit -m "feat: add guest status endpoint for checking remaining executions"
```

---

## Task 7: Update Auth Context to Track Guest Limit

**Files:**
- Modify: `src/contexts/auth-context.tsx`

**Step 1: Read the current auth context file**

First read the file to see current structure.

**Step 2: Add guest limit state and fetch function**

Add to the AuthContext interface:

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  // Add these:
  guestExecutionsRemaining: number | null;
  guestLimitReached: boolean;
  refreshGuestStatus: () => Promise<void>;
  // existing methods...
  login: (password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => Promise<void>;
}
```

Add state and function in the provider:

```typescript
const [guestExecutionsRemaining, setGuestExecutionsRemaining] = useState<number | null>(null);
const [guestLimitReached, setGuestLimitReached] = useState(false);

const refreshGuestStatus = async () => {
  if (!isAuthenticated || !isGuest) {
    setGuestExecutionsRemaining(null);
    setGuestLimitReached(false);
    return;
  }

  try {
    const response = await fetch("/api/auth/guest-status");
    if (response.ok) {
      const data = await response.json();
      setGuestExecutionsRemaining(data.executionsRemaining);
      setGuestLimitReached(data.limitReached);
    }
  } catch (error) {
    console.error("Failed to fetch guest status:", error);
  }
};
```

Call `refreshGuestStatus` after successful guest login and include new values in context value.

**Step 3: Commit**

```bash
git add src/contexts/auth-context.tsx
git commit -m "feat: add guest limit tracking to auth context"
```

---

## Task 8: Show Guest Limit UI Feedback

**Files:**
- Identify main UI component that shows execution area (likely needs exploration)

**Step 1: Find the main execution UI component**

Search for the component that handles the execute button and displays results.

**Step 2: Add guest execution counter display**

Display remaining executions for guests: "X of 5 guest executions remaining"

**Step 3: Handle limit reached state**

When `guestLimitReached` is true, disable execute button and show message prompting login.

**Step 4: Commit**

```bash
git add [identified-ui-files]
git commit -m "feat: add guest execution limit UI feedback"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Extend session type | `src/types/auth.ts` |
| 2 | Create IP rate limit store | `src/lib/guest-rate-limit.ts` |
| 3 | Add IP extraction helper | `src/lib/guest-rate-limit.ts` |
| 4 | Add limit check to execute route | `src/app/api/execute/route.ts` |
| 5 | Initialize count on guest login | `src/app/api/auth/guest/route.ts` |
| 6 | Add guest status endpoint | `src/app/api/auth/guest-status/route.ts`, `src/middleware.ts` |
| 7 | Update auth context | `src/contexts/auth-context.tsx` |
| 8 | Add UI feedback | TBD based on codebase exploration |

## Security Notes

- **Session-based tracking**: Stored in encrypted iron-session cookie. Tamper-resistant but user can clear cookies.
- **IP-based tracking**: Server-side Map, survives cookie clearing. Resets on server restart (acceptable for basic protection).
- **Hybrid approach**: Blocks if EITHER limit is reached, making it harder to bypass.
- **For production hardening**: Consider Redis for persistent IP storage, add fingerprinting, or implement proper user accounts.
