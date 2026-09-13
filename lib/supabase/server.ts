import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClerkSupabaseClient } from "./clerk-server";
import { createLegacySupabaseClient } from "./legacy-server";
export { requireUser } from "@/lib/auth/require-user";

export async function createClient(): Promise<SupabaseClient> {
  const { userId } = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? await auth()
    : { userId: null };
  if (userId) {
    const client = await createClerkSupabaseClient();
    if (client) return client;
  }
  return createLegacySupabaseClient();
}
