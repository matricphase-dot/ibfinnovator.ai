import { clerkMiddleware } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isValidClerkPublishableKey } from "./lib/clerk-keys";

const protectedPaths = [
  "/dashboard",
  "/matches",
  "/bookmarks",
  "/profile",
  "/settings",
  "/chat",
  "/team",
  "/meetings",
  "/analytics",
  "/notifications",
  "/cofounder-matches",
  "/credentials",
  "/applications",
  "/auth/complete-onboarding",
  "/marketplace/inquiries",
  "/university",
  "/projects/new",
];

const isProtected = (path: string) =>
  protectedPaths.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Mirror of Clerk's own publishable-key validation
 * (@clerk/shared -> parsePublishableKey / isPublishableKey).
 *
 * Why this exists: clerkMiddleware throws "Publishable key not valid" for a
 * malformed key, and that throw happens inside the request handler, so EVERY
 * route returns 500 — including public pages and the legacy sign-in flow. A
 * single typo or placeholder value in the Vercel environment would take the
 * whole site down.
 *
 * Checking the format up front means a bad key degrades to legacy auth with a
 * loud warning instead of a site-wide outage.
 */

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

const clerkKeyLooksValid = isValidClerkPublishableKey(clerkPublishableKey);
const clerkConfigured = Boolean(clerkSecretKey) && clerkKeyLooksValid;

if (clerkSecretKey && clerkPublishableKey && !clerkKeyLooksValid) {
  console.error(
    "[middleware] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not a valid Clerk key " +
      "(expected pk_test_... or pk_live_...). Clerk auth is DISABLED and the " +
      "app is running in legacy Supabase-only mode. Fix the Vercel environment " +
      "variable and redeploy.",
  );
}

/**
 * Legacy Supabase session check. Also refreshes the Supabase auth cookies so
 * existing email/password sessions keep working during the dual-auth rollout.
 */
async function legacySession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, response };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response };
}

async function legacyOnlyMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { user, response } = await legacySession(request);

  if (!user && isProtected(path)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/signin";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path === "/auth/signin" || path === "/auth/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

const dualAuthMiddleware = clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;

  if (!isProtected(path)) return NextResponse.next();

  const { userId } = await auth();
  if (userId) return NextResponse.next();

  const { user, response } = await legacySession(request);
  if (user) return response;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/auth/signin";
  redirectUrl.searchParams.set("next", path);
  return NextResponse.redirect(redirectUrl);
});

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (!clerkConfigured) return legacyOnlyMiddleware(request);

  try {
    return await dualAuthMiddleware(request, event);
  } catch (error) {
    // Clerk is reachable but broken (bad secret key, malformed key, Clerk
    // outage). Keep the site serving in legacy mode rather than 500 every
    // route. Responses and redirects are returned, not thrown, so a caught
    // error here always means a genuine Clerk failure.
    console.error(
      "[middleware] Clerk middleware failed; falling back to legacy Supabase " +
        "auth for this request:",
      error,
    );
    return legacyOnlyMiddleware(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
