import { NextRequest, NextResponse } from "next/server";

// Rate limit: 50 generate requests per IP per 24 hours.
// In-memory — resets on container restart. Acceptable for Phase 0 validation.
// For production, replace with Upstash Redis via @upstash/ratelimit.

const RATE_LIMIT = 50;
const WINDOW_MS = 24 * 60 * 60 * 1000;

// In-memory store — resets on cold start, which is acceptable for Phase 0.
const ipCounts = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  // Only rate-limit the /api/rewrite proxy route
  if (!request.nextUrl.pathname.startsWith("/api/rewrite")) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = ipCounts.get(ip);

  if (!entry || entry.resetAt < now) {
    ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= RATE_LIMIT) {
    return NextResponse.json(
      { detail: `Rate limit reached. You can run ${RATE_LIMIT} comparisons per 24 hours.` },
      { status: 429 }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/rewrite"],
};
