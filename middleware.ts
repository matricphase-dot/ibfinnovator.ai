import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/matches",
  "/bookmarks",
  "/profile",
  "/chat",
  "/team",
  "/cofounder-matches",
  "/meetings",
  "/analytics",
  "/settings",
  "/notifications",
  "/applications",
  "/credentials",
  "/onboarding",
];

function isProtected(pathname: string) {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (isProtected(request.nextUrl.pathname)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
