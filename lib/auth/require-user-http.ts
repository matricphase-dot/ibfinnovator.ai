import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";

/**
 * `requireUser()` for route handlers.
 *
 * requireUser() throws when there is no session — and with Clerk configured but
 * unavailable for a request, the error it throws is a Clerk internal message.
 * Returning that to the client leaked implementation detail and answered 400
 * instead of 401, so every route should go through here: any failure to
 * establish a session becomes a plain 401.
 */
export async function requireUserOr401(): Promise<
  | { session: Awaited<ReturnType<typeof requireUser>>; response: null }
  | { session: null; response: NextResponse }
> {
  try {
    const session = await requireUser();
    return { session, response: null };
  } catch {
    return {
      session: null,
      response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    };
  }
}
