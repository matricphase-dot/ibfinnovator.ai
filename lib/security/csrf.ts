/**
 * ROOT FIX for M7: CSRF defense-in-depth.
 * Supabase SSR relies on SameSite=Lax cookies. That blocks cross-site POST
 * top-level form posts, but offers zero protection if a cookie ever flips to
 * SameSite=None, and no protection for same-site XSS-driven fetches.
 * Root fix: enforce Origin/Referer + Sec-Fetch-Site at the edge for every
 * state-changing request, with a shared helper for API routes.
 */

export function getRequestOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  // Fall back to Referer for form posts / navigations without Origin
  const referer = req.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isOriginAllowed(req: Request): boolean {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    "";
  if (!host) return false;

  const origin = getRequestOrigin(req);
  // No Origin/Referer (curl, native app, same-origin fetch without headers):
  // allow — authentication + RLS remain the real gate. Strict blocking here
  // would break legitimate non-browser clients.
  if (!origin) return true;

  let originHost = "";
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const expected = host.toLowerCase().split(":")[0];
  const actual = originHost.split(":")[0];

  if (actual === expected) return true;
  // Allow configured app URL (staging/prod share one fallback today)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (actual === new URL(appUrl).host.toLowerCase().split(":")[0])
        return true;
    } catch {
      // ignore malformed env
    }
  }
  return false;
}

export function isCrossSiteFetch(req: Request): boolean {
  return req.headers.get("sec-fetch-site") === "cross-site";
}

/**
 * Returns an error message when the request must be rejected, else null.
 * Policy: state-changing methods from a declared cross-site context are
 * rejected outright; otherwise a mismatched Origin/Referer is rejected.
 */
export function getCsrfRejection(req: Request): string | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS")
    return null;
  if (isCrossSiteFetch(req)) return "Cross-site request rejected";
  if (!isOriginAllowed(req)) return "Origin not allowed";
  return null;
}
