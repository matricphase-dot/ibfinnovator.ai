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

  const { data: profile, error } = await supabase.rpc("current_user_profile");
  if (error) throw error;
  const p = profile as
    | { id: string; email: string; name: string; role: AuthenticatedProfile["role"]; onboarding_completed: boolean }
    | null;
  if (!p?.id) throw new Error("PROFILE_NOT_FOUND");

  return {
    supabase,
    user: {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      onboarding_completed: p.onboarding_completed ?? false,
      provider: "supabase",
    },
  };
}
