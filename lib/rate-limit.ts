type Result = { allowed: boolean; remaining: number; resetAt: number };
type Entry = { hits: number[] };
const globalStore = globalThis as unknown as {
  __ibfRateLimits?: Map<string, Entry>;
  __ibfRateChecks?: number;
};
const store:Map<string,Entry>=(globalStore.__ibfRateLimits??=new Map<string,Entry>());
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Result {
  const now=Date.now();
  const cutoff=now-windowSeconds*1000;
  const entry:Entry=store.get(key)||{hits:[]};
  entry.hits = entry.hits.filter((x) => x > cutoff);
  const allowed = entry.hits.length < limit;
  if (allowed) entry.hits.push(now);
  store.set(key, entry);
  globalStore.__ibfRateChecks = (globalStore.__ibfRateChecks || 0) + 1;
  if (globalStore.__ibfRateChecks % 100 === 0)
    for (const [k, v] of store)
      if (!v.hits.some((x) => x > cutoff)) store.delete(k);
  return {
    allowed,
    remaining: Math.max(0, limit - entry.hits.length),
    resetAt: (entry.hits[0] || now) + windowSeconds * 1000,
  };
}
export function rateLimitResponse(result: Result) {
  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfter }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    },
  );
}
// In-memory limits are per warm Vercel instance. Use Upstash Redis before multi-region scale.
