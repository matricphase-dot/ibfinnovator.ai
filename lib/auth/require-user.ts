import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-server";
import { createLegacySupabaseClient } from "@/lib/supabase/legacy-server";
import type { AuthenticatedProfile } from "./identity";

export async function requireUser(): Promise<{
  supabase: SupabaseClient;
  user: AuthenticatedProfile;
}> {
  const { userId } = await auth();
  if (userId) {
    const supabase = await createClerkSupabaseClient();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, clerk_user_id, email, name, role, onboarding_completed")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      if (profile) {
        return {
          supabase,
          user: {
            id: profile.id,
            clerkId: userId,
            supabaseId: null,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            onboarding_completed: profile.onboarding_completed ?? false,
            provider: "clerk",
          },
        };
      }
    }
  }

  const { supabase, user } = await createLegacySupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  return {
    supabase,
    user: {
      id: profile.id,
      clerkId: null,
      supabaseId: user.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      onboarding_completed: profile.onboarding_completed ?? false,
      provider: "supabase",
    },
  };
}
