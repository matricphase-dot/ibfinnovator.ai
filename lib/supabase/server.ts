import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClerkSupabaseClient } from "./clerk-server";
import { createLegacySupabaseClient } from "./legacy-server";
import { getSupabasePublic } from "./public";
export { requireUser } from "@/lib/auth/require-user";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function createClient(): Promise<SupabaseClient> {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (userId) {
      const client = await createClerkSupabaseClient();
      if (client) return client;
    }
    return getSupabasePublic();
  }
  return createLegacySupabaseClient();
}

