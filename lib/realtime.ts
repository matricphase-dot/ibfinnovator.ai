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

/**
 * Pull the storage path out of a Supabase URL so it can be re-signed after the
 * token expires. Handles both public and signed URL shapes.
 */
export function parseStorageUrl(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const match = new URL(url).pathname.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/,
    );
    if (!match) return null;
    return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}
