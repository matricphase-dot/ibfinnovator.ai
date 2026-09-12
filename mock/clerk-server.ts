// DEV-ONLY demo shim for `@clerk/nextjs/server`.
// Active only when DEMO_MODE=true (see next.config.ts). The sandbox preview
// cannot reach clerk.com (egress-blocked), so this shim fakes the Clerk
// server API using a `demo_session` cookie. With real Clerk keys on your
// machine, the real package is used instead — this file never runs.
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export type DemoSession = { id: string; name: string; email: string };

export function parseSessionValue(
  value: string | undefined,
): DemoSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (parsed && typeof parsed.id === "string") return parsed as DemoSession;
  } catch {
    /* ignore malformed cookie */
  }
  return null;
}

export function readDemoSessionFromCookieHeader(
  cookieHeader: string | undefined | null,
): DemoSession | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)demo_session=([^;]*)/);
  return match ? parseSessionValue(match[1]) : null;
}

/** Mirrors `auth()` — returns the demo user id when a session cookie exists. */
export async function auth() {
  try {
    const store = await cookies();
    const session = parseSessionValue(store.get("demo_session")?.value);
    return { userId: session?.id ?? null };
  } catch {
    return { userId: null };
  }
}

/** Mirrors `currentUser()`. */
export async function currentUser() {
  try {
    const store = await cookies();
    const session = parseSessionValue(store.get("demo_session")?.value);
    if (!session) return null;
    return {
      id: session.id,
      firstName: session.name.split(" ")[0] || session.name,
      fullName: session.name,
      username: null,
      imageUrl: null,
      primaryEmailAddress: { emailAddress: session.email },
    };
  } catch {
    return null;
  }
}

/** Mirrors `clerkClient()` — backend user management calls are no-ops. */
export async function clerkClient() {
  return {
    users: {
      updateUserMetadata: async () => ({}),
      deleteUser: async () => ({}),
      getUser: async () => ({}),
    },
  };
}

/**
 * Mirrors `clerkMiddleware()`: protected routes redirect to /auth/signin
 * unless a demo_session cookie is present. `auth.protect()` "blocks" by
 * throwing a NextResponse redirect, which this wrapper catches and returns.
 */
export function clerkMiddleware(
  handler: (
    authObj: any,
    request: NextRequest,
    event: any,
  ) => Promise<Response | void> | Response | void,
) {
  return async function middleware(
    request: NextRequest,
    event: any,
  ): Promise<Response> {
    const session = readDemoSessionFromCookieHeader(
      request.headers.get("cookie"),
    );
    const authObj = {
      userId: session?.id ?? null,
      protect: async () => {
        if (!session) {
          const url = new URL("/auth/signin", request.url);
          throw NextResponse.redirect(url);
        }
      },
    };
    try {
      const response = await handler(authObj, request, event);
      return (
        response ??
        NextResponse.next({ request: { headers: request.headers } })
      );
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}
