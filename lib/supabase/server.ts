import { createClerkSupabaseClient } from "./clerk-server";
import { createLegacySupabaseClient } from "./legacy-server";
import { getSupabasePublic } from "./public";
import { isValidClerkPublishableKey } from "@/lib/clerk-keys";

/**
 * Whether Clerk is usable in this process. Mirrors the check in middleware.ts:
 * a secret key alone is not enough, the publishable key must be well-formed, or
 * clerkMiddleware never runs and the Clerk SDK is not wired up at all.
 */
function clerkConfigured(): boolean {
  return (
    Boolean(process.env.CLERK_SECRET_KEY) &&
    isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  );
}

/**
 * Session-aware Supabase client, with graceful fallbacks.
 *
 * Resolution order:
 *   1. Clerk session           -> RLS as the signed-in user (Clerk-issued JWT)
 *   2. Supabase cookie session -> RLS as the signed-in legacy user
 *   3. Neither                 -> anonymous client, so RLS policies that expose
 *                                 public rows are evaluated as `anon` instead of
 *                                 the request failing outright.
 *
 * Step 3 matters because this helper is used by route handlers that also serve
 * signed-out visitors. Two distinct failure modes previously made those reads
 * throw before they ever reached the database:
 *
 *   a) Clerk configured, no session -> createLegacySupabaseClient() throws
 *      UNAUTHORIZED when there is no cookie session.
 *   b) Clerk not configured at all  -> the Clerk SDK's auth() throws, because
 *      clerkMiddleware never ran ("auth() was called but Clerk can't detect
 *      usage of clerkMiddleware()"). The app is *designed* to keep working in
 *      this legacy-only mode, and middleware.ts logs that it is doing so — but
 *      every public read died anyway.
 *
 * Both produced 500s on public endpoints that are supposed to be readable
 * anonymously:
 *
 *   GET /api/projects            -> 500    GET /api/users/[id]          -> 500
 *   GET /api/events              -> 500    GET /api/certificates/[code] -> 500 (valid codes)
 *   GET /api/marketplace         -> 500    GET /api/investors           -> 500
 *
 * Migrations 013 and 018 made these reads legal for the `anon` role at the
 * database layer; this restores the code path that actually exercises them.
 *
 * Authenticated routes are unaffected: they call requireUser(), which resolves
 * identities through the Clerk/legacy clients directly and still throws when no
 * session exists — so their 401 responses are unchanged.
 */
export async function createClient() {
  if (clerkConfigured()) {
    try {
      const clerk = await createClerkSupabaseClient();
      if (clerk) return clerk;
    } catch {
      // Clerk reachable but unusable — fall through rather than failing the
      // request. RLS still gates what an anonymous caller can read.
    }
  }

  try {
    const { supabase } = await createLegacySupabaseClient();
    return supabase;
  } catch {
    // No session at all — anonymous client. Row access is still gated by RLS,
    // so this exposes exactly what the policies allow `anon` to read.
    return getSupabasePublic();
  }
}

export { requireUser } from "@/lib/auth/require-user";
