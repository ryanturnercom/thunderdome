// In-memory store for IP-based guest execution tracking
// Resets on server restart - provides basic protection against cookie clearing

import { NextRequest } from "next/server";

// Get limit from environment variable, default to 20 executions per day
export function getGuestExecutionLimit(): number {
  const envLimit = process.env.GUEST_DAILY_EXECUTION_LIMIT;
  if (envLimit) {
    const parsed = parseInt(envLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 20; // Default limit
}

// For backwards compatibility - computed at runtime
export const GUEST_EXECUTION_LIMIT = getGuestExecutionLimit();

// Get the current date string (YYYY-MM-DD) for daily tracking
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export interface IPRecord {
  count: number;
  date: string; // Track the date for daily reset
}

// In-memory store - for production, consider Redis
const ipStore = new Map<string, IPRecord>();

// Cleanup entries from previous days
function cleanupOldEntries() {
  const today = getCurrentDateString();
  for (const [ip, record] of ipStore.entries()) {
    if (record.date !== today) {
      ipStore.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldEntries, 60 * 60 * 1000);

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

export function getIPExecutionCount(ip: string): number {
  const record = ipStore.get(ip);
  if (!record) return 0;

  // Reset if it's a new day
  const today = getCurrentDateString();
  if (record.date !== today) {
    ipStore.delete(ip);
    return 0;
  }

  return record.count;
}

export function incrementIPExecutionCount(ip: string): number {
  const today = getCurrentDateString();
  const existing = ipStore.get(ip);

  if (existing && existing.date === today) {
    existing.count += 1;
    return existing.count;
  }

  // New record or new day - start fresh
  ipStore.set(ip, { count: 1, date: today });
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
