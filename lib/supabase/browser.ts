"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * ROOT (Supabase-only): canonical browser client (Supabase Auth session).
 * Singleton. No Clerk useSession, no JWT template.
 */
export function useSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (!client) client = createBrowserClient(url, key);
  return client;
}

/** Non-hook accessor for event handlers outside React render. */
export function getSupabaseBrowser(): SupabaseClient {
  return useSupabaseBrowser();
}
