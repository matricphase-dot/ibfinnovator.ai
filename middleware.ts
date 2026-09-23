import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeRedirectUrl } from "@/lib/utils";

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
    const expected = (req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
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

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/matches(.*)",
  "/bookmarks(.*)",
  "/profile",
  "/settings(.*)",
  "/chat(.*)",
  "/team(.*)",
  "/meetings(.*)",
  "/analytics(.*)",
  "/notifications(.*)",
  "/cofounder-matches(.*)",
  "/credentials(.*)",
  "/applications(.*)",
  "/auth/complete-onboarding(.*)",
  "/marketplace/inquiries(.*)",
  "/university(.*)",
  "/projects/new(.*)",
]);

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

async function legacy(req: NextRequest) {
  const csrfRejection = rejectCrossSiteMutation(req);
  if (csrfRejection) return csrfRejection;
  if (!isProtected(req)) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request: req });
  const client = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    },
  );

  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    return touchPresenceCookie(response, req);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/auth/signin";
  const safeNext = sanitizeRedirectUrl(
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
    "/dashboard",
  );
  url.searchParams.set("next", safeNext);
  return NextResponse.redirect(url);
}

const hybrid = clerkMiddleware(async (clerkAuth, req) => {
  const csrfRejection = rejectCrossSiteMutation(req);
  if (csrfRejection) return csrfRejection;
  if (!isProtected(req)) return NextResponse.next();
  const { userId } = await clerkAuth();
  if (userId) {
    return touchPresenceCookie(NextResponse.next(), req);
  }
  return legacy(req);
});

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
process.env.CLERK_SECRET_KEY
  ? hybrid
  : legacy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)",
  ],
};

