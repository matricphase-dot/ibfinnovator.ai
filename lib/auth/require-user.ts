import { createClient } from "@/lib/supabase/server";
import type { AuthenticatedProfile } from "./identity";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result = { supabase: SupabaseClient; user: AuthenticatedProfile };

/**
 * ROOT (Supabase-only): the single gate for every protected API route / server action.
 * Session = Supabase Auth (auth.getUser → auth.uid()). Profile row keyed by id = auth uid.
 * Fail-closed: no session → UNAUTHORIZED; no profile row → PROFILE_NOT_FOUND.
 */
export async function requireUser(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();
  if (sessionError || !user) throw new Error("UNAUTHORIZED");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,name,role,onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  return {
    supabase,
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      onboarding_completed: profile.onboarding_completed ?? false,
      provider: "supabase",
    },
  };
}
