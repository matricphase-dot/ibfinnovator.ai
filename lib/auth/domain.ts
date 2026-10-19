/**
 * Multi-domain and cross-subdomain authentication configuration.
 * - Apex: https://innovators-global.com (public landing, marketing, public portfolios, /help, /auth/*)
 * - App:  https://app.innovators-global.com (authenticated workspace: /dashboard, /projects, /chat, etc.)
 * - Shared cookie domain: .innovators-global.com
 */

export const IS_PROD = process.env.NODE_ENV === "production";

export const COOKIE_DOMAIN = IS_PROD ? ".innovators-global.com" : undefined;

export const MARKETING_ORIGIN = IS_PROD
  ? "https://innovators-global.com"
  : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

export const APP_ORIGIN = IS_PROD
  ? "https://app.innovators-global.com"
  : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

export const DEFAULT_APP_HOME = IS_PROD
  ? "https://app.innovators-global.com/dashboard"
  : "/dashboard";

export const DEFAULT_SIGNIN_URL = `${MARKETING_ORIGIN}/auth/signin`;

/**
 * Validates and sanitizes a post-auth redirect target.
 * Only allows trusted origins (app.innovators-global.com, localhost in dev)
 * or local relative paths.
 */
export function sanitizeNext(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") {
    return DEFAULT_APP_HOME;
  }
  const t = raw.trim();

  // 1. Explicit app subdomain destination
  if (
    t.startsWith("https://app.innovators-global.com/") ||
    t === "https://app.innovators-global.com" ||
    (!IS_PROD && (t.startsWith("http://localhost:3000/") || t.startsWith("http://127.0.0.1:3000/")))
  ) {
    return t;
  }

  // 2. Local relative path (e.g. /dashboard, /projects/123)
  if (
    t.startsWith("/") &&
    !t.startsWith("//") &&
    !t.startsWith("/\\") &&
    !t.includes("\\") &&
    !t.includes("://") &&
    !/[\x00-\x1F\x7F]/.test(t) &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)
  ) {
    // In production, app routes belong on the app subdomain
    if (IS_PROD) {
      if (
        t === "/" ||
        t === "/help" ||
        t.startsWith("/portfolio/") ||
        t === "/auth/signin" ||
        t === "/auth/signup" ||
        t === "/auth/forgot-password" ||
        t === "/auth/reset-password" ||
        t.startsWith("/auth/callback")
      ) {
        return `${MARKETING_ORIGIN}${t}`;
      }
      return `${APP_ORIGIN}${t}`;
    }
    return t;
  }

  return DEFAULT_APP_HOME;
}

export function getSharedCookieOptions() {
  return {
    domain: COOKIE_DOMAIN,
    path: "/",
    sameSite: "lax" as const,
    secure: IS_PROD,
  };
}
