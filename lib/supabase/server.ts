import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
export { requireUser } from "@/lib/auth/require-user";

/**
 * ROOT (Supabase-only): server Supabase client bound to request cookies.
 * Auth = Supabase Auth session (email / Google / LinkedIn-OIDC).
 * No Clerk, no JWT template, no service-role. RLS via auth.uid().
 */
export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase server client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Called from Server Component (read-only): middleware refreshes instead.
        }
      },
    },
  });
}
