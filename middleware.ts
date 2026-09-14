import { clerkMiddleware } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

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
 * Clerk is optional until its keys are present in the environment. When they
 * are missing we fall back to the previous Supabase-only behaviour instead of
 * throwing on every request.
 */
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

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

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured) return legacyOnlyMiddleware(request);
  return dualAuthMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
