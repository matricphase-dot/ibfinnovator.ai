import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
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
async function touch(
  response: NextResponse,
  column: "id" | "clerk_user_id",
  value: string,
  req: NextRequest,
) {
  const last = Number(req.cookies.get("ibf_seen")?.value || 0),
    now = Date.now();
  if (now - last < 60000) return response;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key)
    try {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
        auth: { persistSession: false },
      });
      await admin
        .from("profiles")
        .update({ last_seen_at: new Date(now).toISOString() })
        .eq(column, value);
    } catch (e) {
      console.error("[presence:touch]", e);
    }
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
  let response = NextResponse.next({ request: req });
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  if (user) return touch(response, "id", user.id, req);
  const url = req.nextUrl.clone();
  url.pathname = "/auth/signin";
  url.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(url);
}
const hybrid = clerkMiddleware(async (clerkAuth, req) => {
  if (!isProtected(req)) return NextResponse.next();
  const { userId } = await clerkAuth();
  if (userId) return touch(NextResponse.next(), "clerk_user_id", userId, req);
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
