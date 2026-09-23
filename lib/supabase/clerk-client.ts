"use client";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
export function useClerkSupabaseClient() {
  const { session } = useSession();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key-for-build";

  return useMemo(
    () =>
      session
        ? createClient(url, key, {
            accessToken: async () =>
              (await session.getToken({ template: "supabase" })) ?? null,
          })
        : createBrowserClient(url, key),
    [session, url, key],
  );

}
