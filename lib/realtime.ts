import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client, used only for Realtime channels (presence + change
 * notifications). Reads and writes still go through the app's API routes, so
 * this client never needs a privileged key — it is the anon key, and RLS
 * decides which change events a subscriber receives.
 *
 * Returns null when the public Supabase env vars are absent, which is the
 * signal for callers to fall back to polling only.
 */

let client: SupabaseClient | null = null;

export function getRealtimeClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    client = createBrowserClient(url, anonKey);
  } catch {
    return null;
  }
  return client;
}
