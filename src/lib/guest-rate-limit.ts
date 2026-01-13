// In-memory store for IP-based guest execution tracking
// Resets on server restart - provides basic protection against cookie clearing

import { NextRequest } from "next/server";

export const GUEST_EXECUTION_LIMIT = 5;
export const IP_STORE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface IPRecord {
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
