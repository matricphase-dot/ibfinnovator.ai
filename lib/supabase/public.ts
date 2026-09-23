import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (client) return client;
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key-for-build";

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabasePublic() as any;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

