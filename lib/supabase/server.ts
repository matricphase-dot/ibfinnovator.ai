import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Supabase is used ONLY as the database. Authentication is handled by
 * Clerk, so all queries run server-side with the service-role key
 * (bypasses Supabase Auth / RLS — authorization is enforced in the
 * API routes themselves).
 *
 * When DEMO_MODE=true (offline sandbox preview only), these functions
 * delegate to an in-memory seeded stand-in in mock/supabase-server.ts.
 * DEMO_MODE must NEVER be set in production.
 */
export async function createClient(): Promise<SupabaseClient> {
  if (process.env.DEMO_MODE === "true") {
    const demo = await import("@/mock/supabase-server");
    return (await demo.createClient()) as unknown as SupabaseClient;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey)
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Returns the authenticated Clerk user plus a Supabase client.
 * The profiles row is provisioned automatically on first sign-in.
 */
export async function requireUser(): Promise<{
  supabase: SupabaseClient;
  user: { id: string; email: string };
}> {
  if (process.env.DEMO_MODE === "true") {
    const demo = await import("@/mock/supabase-server");
    return (await demo.requireUser()) as unknown as {
      supabase: SupabaseClient;
      user: { id: string; email: string };
    };
  }

  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", userId)
    .maybeSingle();

  if (profile) return { supabase, user: { id: userId, email: profile.email } };

  // First sign-in with Clerk → create the profile row.
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  const name =
    clerkUser?.fullName ||
    clerkUser?.username ||
    email.split("@")[0] ||
    "New member";

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    name,
    avatar_url: clerkUser?.imageUrl ?? null,
  });
  // 23505 = unique violation → another concurrent first request already
  // created the profile, which is fine.
  if (error && error.code !== "23505") throw error;

  return { supabase, user: { id: userId, email } };
}
