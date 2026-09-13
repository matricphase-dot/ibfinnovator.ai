"use client";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
export function useClerkSupabaseClient() {
  const { session } = useSession();
  return useMemo(
    () =>
      session
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { accessToken: async () => (await session.getToken()) ?? null },
          )
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          ),
    [session],
  );
}
