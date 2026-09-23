import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-server";
import { requireLegacyUser } from "@/lib/supabase/legacy-server";
import type { AuthenticatedProfile } from "./identity";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result = { supabase: SupabaseClient; user: AuthenticatedProfile };

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function requireUser(): Promise<Result> {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("UNAUTHORIZED");
    }

    const supabase = await createClerkSupabaseClient();
    if (!supabase) {
      throw new Error("UNAUTHORIZED");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,clerk_user_id,email,name,role,onboarding_completed")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      throw new Error("PROFILE_NOT_FOUND");
    }

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

  // Fallback to legacy Supabase auth only when Clerk is NOT configured
  try {
    const { supabase, user } = await requireLegacyUser();
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
        clerkId: null,
        supabaseId: user.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        onboarding_completed: profile.onboarding_completed ?? false,
        provider: "supabase",
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "PROFILE_NOT_FOUND") throw e;
    throw new Error("UNAUTHORIZED");
  }
}
