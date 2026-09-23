import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeRedirectUrl } from "@/lib/utils";

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
  const last = Number(req.cookies.get("ibf_seen")?.value || 0);
  const now = Date.now();
  if (now - last < 60000) return response;

  response.cookies.set("ibf_seen", String(now), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });
  return response;
}

async function legacy(req: NextRequest) {
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

