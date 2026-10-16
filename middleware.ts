import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function sanitizeNext(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const t = raw.trim();
  if (
    !t.startsWith("/") ||
    t.startsWith("//") ||
    t.startsWith("/\\") ||
    t.includes("\\") ||
    t.includes("://") ||
    /[\x00-\x1F\x7F]/.test(t) ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)
  ) {
    return "/dashboard";
  }
  return t;
}

function rejectCrossSiteMutation(req: NextRequest): NextResponse | null {
  // ROOT FIX M7: edge-level CSRF gate for state-changing API calls.
  // Safe methods pass; cross-site fetches and mismatched Origin/Referer fail closed.
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
    ).host.toLowerCase();
    const expected = (
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host") ||
      ""
    )
      .toLowerCase()
      .split(":")[0];
    const actual = originHost.split(":")[0];
    if (expected && actual !== expected) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl || actual !== new URL(appUrl).host.toLowerCase().split(":")[0]) {
        return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  return null;
}

const PROTECTED = [
  "/dashboard",
  "/profile",
  "/settings",
  "/chat",
  "/team",
  "/meetings",
  "/analytics",
  "/notifications",
  "/applications",
  "/auth/complete-onboarding",
  "/auth/choose-role",
  "/projects/new",
];

function isProtectedPath(pathname: string) {
  return PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function touchPresenceCookie(response: NextResponse, req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  // ROOT FIX (hardening): __Host- prefix in prod binds cookie to host+secure+path.
  // Dev over http cannot set Secure, so keep the plain name there.
  const cookieName = isProd ? "__Host-ibf_seen" : "ibf_seen";
  const last = Number(req.cookies.get(cookieName)?.value || 0);
  const now = Date.now();
  if (now - last < 60000) return response;

  response.cookies.set(cookieName, String(now), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });
  return response;
}

// ROOT FIX (Phase 2): Subdomain Routing + Clean Auth Protection
export default async function middleware(req: NextRequest) {
  const csrfRejection = rejectCrossSiteMutation(req);
  if (csrfRejection) return csrfRejection;

  const host = (
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    ""
  ).toLowerCase();

  const pathname = req.nextUrl.pathname;

  // Detect whether request is targeting the authenticated App subdomain or local dev port
  // In development, localhost / 127.0.0.1 acts as the app workspace, or app.localhost
  const isAppSubdomain =
    host.startsWith("app.") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  // ---------------------------------------------------------------------------
  // 1. Root Domain (innovator-global.com / public marketing & portfolio edge)
  // ---------------------------------------------------------------------------
  if (!isAppSubdomain) {
    // Rewrite /@username to internal /portfolio/[username]
    if (pathname.startsWith("/@")) {
      const username = pathname.slice(2).split("/")[0];
      if (username) {
        const url = req.nextUrl.clone();
        url.pathname = `/portfolio/${username}`;
        return NextResponse.rewrite(url);
      }
    }

    // Direct /portfolio/[username] access on root domain passes cleanly
    if (pathname.startsWith("/portfolio/") || pathname === "/" || pathname === "/help") {
      return NextResponse.next();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. App Subdomain (app.innovator-global.com / authenticated workspace)
  // ---------------------------------------------------------------------------
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request: req });
  let userId: string | null = null;

  if (url && key) {
    const client = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }

  // Handle protected app routes
  if (!isProtectedPath(pathname)) return response;
  if (userId) return touchPresenceCookie(response, req);

  // Unauthenticated user -> redirect to sign-in
  const redirect = req.nextUrl.clone();
  redirect.pathname = "/auth/signin";
  redirect.searchParams.set(
    "next",
    sanitizeNext(`${pathname}${req.nextUrl.search}`),
  );
  return NextResponse.redirect(redirect);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)",
  ],
};
