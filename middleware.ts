import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  IS_PROD,
  COOKIE_DOMAIN,
  MARKETING_ORIGIN,
  APP_ORIGIN,
  sanitizeNext,
  getSharedCookieOptions,
} from "@/lib/auth/domain";

function rejectCrossSiteMutation(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS")
    return null;
  if (!req.nextUrl.pathname.startsWith("/api/")) return null;
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json(
      { error: "Cross-site request rejected" },
      { status: 403 },
    );
  }
  const origin =
    req.headers.get("origin") ?? req.headers.get("referer") ?? null;
  if (!origin) return null; // non-browser client (curl/native) — auth+RLS remain the gate
  try {
    const originHost = new URL(
      origin.startsWith("http") ? origin : `https://${origin}`,
    ).host.toLowerCase().split(":")[0];

    // Whitelist production domains
    if (
      originHost === "innovators-global.com" ||
      originHost === "www.innovators-global.com" ||
      originHost === "app.innovators-global.com"
    ) {
      return null;
    }

    const hostHeader = (
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host") ||
      ""
    ).toLowerCase().split(":")[0];

    if (
      originHost === hostHeader ||
      originHost === "localhost" ||
      originHost === "127.0.0.1"
    ) {
      return null;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && originHost === new URL(appUrl).host.toLowerCase().split(":")[0]) {
      return null;
    }

    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
}

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/chat",
  "/team",
  "/meetings",
  "/analytics",
  "/notifications",
  "/applications",
  "/bookmarks",
  "/auth/complete-onboarding",
  "/auth/choose-role",
  "/projects",
  "/your-issues",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function touchPresenceCookie(response: NextResponse, req: NextRequest): NextResponse {
  const cookieName = "ibf_seen";
  const last = Number(req.cookies.get(cookieName)?.value || 0);
  const now = Date.now();
  if (now - last < 60000) return response;

  response.cookies.set(cookieName, String(now), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: 120,
  });
  return response;
}

export default async function middleware(req: NextRequest) {
  const csrfRejection = rejectCrossSiteMutation(req);
  if (csrfRejection) return csrfRejection;

  const host = (
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    ""
  ).toLowerCase().split(":")[0];

  const { pathname, search } = req.nextUrl;

  // Let API and static files pass through without page redirects
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle /@username rewrite to /portfolio/[username]
  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2).split("/")[0];
    if (username) {
      const url = req.nextUrl.clone();
      url.pathname = `/portfolio/${username}`;
      return NextResponse.rewrite(url);
    }
  }

  // Determine domain
  const isAppDomain = host.startsWith("app.");
  const isMarketingDomain =
    host === "innovators-global.com" ||
    host === "www.innovators-global.com";

  // Initialize Supabase client to check session
  let response = NextResponse.next({ request: req });
  let userId: string | null = null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sharedCookieOpts = getSharedCookieOptions();

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...sharedCookieOpts,
            }),
          );
        },
      },
      cookieOptions: sharedCookieOpts,
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  // Helper to copy any refreshed cookies to a redirect response
  function createRedirect(targetUrl: string | URL): NextResponse {
    const redirectResponse = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, {
        domain: COOKIE_DOMAIN,
        path: "/",
        sameSite: "lax",
        secure: IS_PROD,
      });
    });
    return redirectResponse;
  }

  // ---------------------------------------------------------------------------
  // SCENARIO A: Request is on APP subdomain (app.innovators-global.com)
  // ---------------------------------------------------------------------------
  if (isAppDomain) {
    // Public informational pages belong on the marketing apex
    if (pathname === "/privacy" || pathname === "/help") {
      return NextResponse.redirect(`${MARKETING_ORIGIN}${pathname}${search}`);
    }

    // If NOT authenticated -> Redirect to signin on marketing apex
    if (!userId) {
      const targetPath = pathname === "/" ? "/dashboard" : `${pathname}${search}`;
      const intendedDestination = `${APP_ORIGIN}${targetPath}`;
      const signinUrl = new URL(`${MARKETING_ORIGIN}/auth/signin`);
      signinUrl.searchParams.set("next", intendedDestination);
      return createRedirect(signinUrl);
    }

    // Authenticated on app domain:
    // If hitting root "/" on app -> go to /dashboard
    if (pathname === "/") {
      return createRedirect(new URL("/dashboard", req.url));
    }

    // If hitting auth pages on app -> go to /dashboard
    if (pathname === "/auth/signin" || pathname === "/auth/signup") {
      return createRedirect(new URL("/dashboard", req.url));
    }

    // Allow authenticated access to app routes and touch presence
    return touchPresenceCookie(response, req);
  }

  // ---------------------------------------------------------------------------
  // SCENARIO B: Request is on MARKETING apex domain (innovators-global.com)
  // ---------------------------------------------------------------------------
  if (isMarketingDomain) {
    // 1. Auth pages (/auth/signin, /auth/signup)
    if (pathname === "/auth/signin" || pathname === "/auth/signup") {
      if (userId) {
        // Already logged in! Redirect to target or /dashboard on app subdomain
        const nextParam = req.nextUrl.searchParams.get("next");
        const destination = sanitizeNext(nextParam);
        return createRedirect(destination);
      }
      return response;
    }

    // 2. Auth callback / forgot / reset
    if (pathname.startsWith("/auth/")) {
      return response;
    }

    // 3. Workspace / Protected routes hit directly on marketing domain
    if (isProtectedPath(pathname)) {
      if (userId) {
        // Authenticated -> move to app subdomain
        return createRedirect(`${APP_ORIGIN}${pathname}${search}`);
      } else {
        // Unauthenticated -> redirect to signin on marketing domain with next param
        const intendedDestination = `${APP_ORIGIN}${pathname}${search}`;
        const signinUrl = new URL(`${MARKETING_ORIGIN}/auth/signin`);
        signinUrl.searchParams.set("next", intendedDestination);
        return createRedirect(signinUrl);
      }
    }

    // 4. Public marketing routes (/ landing, /help, /portfolio, etc.)
    return response;
  }

  // ---------------------------------------------------------------------------
  // SCENARIO C: Local Development or Preview Environments (localhost / IP)
  // ---------------------------------------------------------------------------
  if (isProtectedPath(pathname)) {
    if (!userId) {
      const redirect = req.nextUrl.clone();
      redirect.pathname = "/auth/signin";
      redirect.searchParams.set("next", `${pathname}${search}`);
      return createRedirect(redirect);
    }
    return touchPresenceCookie(response, req);
  }

  if (userId && (pathname === "/auth/signin" || pathname === "/auth/signup")) {
    const nextParam = req.nextUrl.searchParams.get("next");
    return createRedirect(sanitizeNext(nextParam));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)",
  ],
};
