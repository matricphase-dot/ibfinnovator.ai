import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("supabasePublic requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabasePublic() as any)[prop];
  },
});
