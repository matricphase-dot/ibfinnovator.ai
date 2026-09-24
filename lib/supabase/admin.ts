import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * ROOT (Supabase-only): service-role client. Server-only, singleton.
 * Throws on missing env (fail-fast, surfaced as 500 + Sentry by apiError).
 * Must never be imported from middleware/edge or client components.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (process.env.NEXT_RUNTIME === "edge") {
    throw new Error("supabaseAdmin must never run on the edge");
  }
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabaseAdmin() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop as string];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(instance)
      : value;
  },
});
