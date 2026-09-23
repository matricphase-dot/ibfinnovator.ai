export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Entry = { hits: number[] };

const globalStore = globalThis as unknown as {
  __ibfRateLimits?: Map<string, Entry>;
  __ibfRateChecks?: number;
};

const store: Map<string, Entry> = (globalStore.__ibfRateLimits ??= new Map<
  string,
  Entry
>());

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const entry: Entry = store.get(key) || { hits: [] };
  entry.hits = entry.hits.filter((x) => x > cutoff);
  const allowed = entry.hits.length < limit;
  if (allowed) entry.hits.push(now);
  store.set(key, entry);

  globalStore.__ibfRateChecks = (globalStore.__ibfRateChecks || 0) + 1;
  if (globalStore.__ibfRateChecks % 100 === 0) {
    for (const [k, v] of store) {
      if (!v.hits.some((x) => x > cutoff)) store.delete(k);
    }
  }

  // If Upstash Redis is configured, sync in background
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", key, "0", String(cutoff)],
        ["ZADD", key, String(now), String(now)],
        ["EXPIRE", key, String(windowSeconds)],
      ]),
    }).catch(() => {});
  }

  return {
    allowed,
    remaining: Math.max(0, limit - entry.hits.length),
    resetAt: (entry.hits[0] || now) + windowSeconds * 1000,
  };
}

export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const now = Date.now();
      const cutoff = now - windowSeconds * 1000;
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["ZREMRANGEBYSCORE", key, "0", String(cutoff)],
          ["ZADD", key, String(now), String(now)],
          ["ZCARD", key],
          ["EXPIRE", key, String(windowSeconds)],
        ]),
      });

      if (res.ok) {
        const results = await res.json();
        const count = Number(results[2]?.result || 0);
        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          resetAt: now + windowSeconds * 1000,
        };
      }
    } catch {
      // Fallback to in-memory on network failure
    }
  }

  return checkRateLimit(key, limit, windowSeconds);
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    },
  );
}

