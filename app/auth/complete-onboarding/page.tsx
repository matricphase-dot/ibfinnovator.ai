import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import OnboardingWizard from "@/components/OnboardingWizard";
import { requireUser } from "@/lib/auth/require-user";
import { isClerkPublishableKeyConfigured } from "@/lib/clerk-keys";

// The role and onboarding state must be read per request.
export const dynamic = "force-dynamic";

export default async function CompleteOnboardingPage() {
  let role: string | null = null;
  let name = "";
  let completed = false;

  // 1. Preferred source: Clerk publicMetadata (set by /api/auth/set-role).
  if (isClerkPublishableKeyConfigured()) {
    try {
      const { userId } = await auth();
      if (userId) {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const metadataRole = user.publicMetadata?.role;
        if (typeof metadataRole === "string") role = metadataRole;
        name =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.username ||
          "";
      }
    } catch (error) {
      // Clerk unreachable — fall through to the profile row below.
      console.error("[complete-onboarding] Clerk lookup failed:", error);
    }
  }

  // 2. Profile row: authoritative for onboarding_completed, and the fallback
  //    source of role for legacy Supabase sessions.
  try {
    const { user } = await requireUser();
    if (!role) role = user.role;
    if (!name) name = user.name || "";
    completed = user.onboarding_completed;
  } catch {
    if (!role) redirect("/auth/signin");
  }

  if (!role) redirect("/auth/choose-role");
  if (completed) redirect("/dashboard");

  return (
    <OnboardingWizard
      mode="resume"
      role={role === "FOUNDER" ? "FOUNDER" : "STUDENT"}
      initialName={name}
    />
  );
}
