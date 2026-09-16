import { createClerkSupabaseClient } from "./clerk-server";
import { createLegacySupabaseClient } from "./legacy-server";
import { getSupabasePublic } from "./public";

/**
 * Session-aware Supabase client, with a graceful anonymous fallback.
 *
 * Resolution order:
 *   1. Clerk session          -> RLS as the signed-in user (Clerk-issued JWT)
 *   2. Supabase cookie session -> RLS as the signed-in legacy user
 *   3. Neither                 -> anonymous client, so RLS policies that expose
 *                                 public rows are evaluated as `anon` instead of
 *                                 the request failing outright.
 *
 * Step 3 matters because this helper is used by route handlers that also serve
 * signed-out visitors. It previously fell straight through to the legacy client,
 * which throws UNAUTHORIZED when there is no cookie session — so as soon as
 * Clerk was configured, every public read died before reaching the database:
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
  const clerk = await createClerkSupabaseClient();
  if (clerk) return clerk;

  try {
    const { supabase } = await createLegacySupabaseClient();
    return supabase;
  } catch {
    // No session at all — fall back to the anonymous client. Row access is
    // still gated by RLS, so this exposes exactly what the policies allow
    // `anon` to read and nothing more.
    return getSupabasePublic();
  }
}

export { requireUser } from "@/lib/auth/require-user";
