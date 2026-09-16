import { NextResponse } from "next/server";

/**
 * Rate limiting, backed by the `rate_limit_hit` function from migration 024.
 *
 * Design notes worth keeping in mind:
 *
 *  * The counter lives in Postgres, not in module memory, so limits hold across
 *    deploys and across serverless instances.
 *  * This helper **fails open**. If the database cannot answer, the request is
 *    allowed through. A rate limiter that fails closed turns one infrastructure
 *    hiccup into a total outage of every guarded route; the trade-off is that a
 *    database outage also lifts the limits, which is the safer failure for a
 *    product this size. Every failure is logged so it is visible.
 *  * Keys are namespaced (`u:` for a member, `ip:` for a caller we cannot
 *    identify) so a user id can never collide with an IP.
 */

export type RateLimitOutcome = {
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
};

/**
 * Identify the caller. A signed-in member is keyed by id — that is stable and
 * cannot be forged. Anonymous callers fall back to the first forwarded address.
 *
 * In production the platform sets x-forwarded-for; the alternative headers are
 * there because the sandbox and some proxies use them.
 */
export function clientKey(request: Request, userId?: string | null) {
  if (userId) return `u:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `ip:${ip}`;
}

export async function checkRateLimit(
  supabase: any,
  options: {
    bucket: string;
    key: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<RateLimitOutcome> {
  const { bucket, key, limit, windowSeconds } = options;
  try {
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_bucket: bucket,
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      // No row means the function did not answer as expected — fail open.
      return { allowed: true, remaining: limit, resetAt: null };
    }
    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      resetAt: row.reset_at ?? null,
    };
  } catch (e: any) {
    console.error(`rate limit check failed for ${bucket}:`, e?.message);
    return { allowed: true, remaining: limit, resetAt: null };
  }
}

/**
 * A 429 that tells the caller when to come back. `Retry-After` is in seconds,
 * which is what clients and proxies expect.
 */
export function rateLimitResponse(outcome: RateLimitOutcome, message?: string) {
  const headers: Record<string, string> = {};
  if (outcome.resetAt) {
    const seconds = Math.max(
      1,
      Math.ceil((new Date(outcome.resetAt).getTime() - Date.now()) / 1000),
    );
    headers["retry-after"] = String(seconds);
  }
  return NextResponse.json(
    {
      error: message ?? "You are doing that too often. Please slow down and try again shortly.",
    },
    { status: 429, headers },
  );
}
