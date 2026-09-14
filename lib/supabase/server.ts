import { createClerkSupabaseClient } from "./clerk-server";
import { createLegacySupabaseClient } from "./legacy-server";

export async function createClient() {
  const clerk = await createClerkSupabaseClient();
  if (clerk) return clerk;
  const { supabase } = await createLegacySupabaseClient();
  return supabase;
}

export { requireUser } from "@/lib/auth/require-user";
