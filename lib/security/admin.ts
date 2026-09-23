import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * ROOT FIX for M6: SUPER_ADMIN must never trust the mutable `profiles.role`
 * row (writable via RLS self-update paths / manual edits with no audit).
 * Source of truth order:
 *   1. Clerk `privateMetadata.role === "SUPER_ADMIN"` (server-side fetch)
 *   2. Legacy fallback: `profiles.role` only when Clerk is NOT configured.
 * Every grant/deny is audit-logged to `admin_audit_log` (best-effort).
 */

export type AdminCheck = {
  clerkId: string | null;
  profileId: string | null;
  isAdmin: boolean;
};

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
);

async function auditAdminCheck(
  entry: AdminCheck & { path: string },
): Promise<void> {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      clerk_user_id: entry.clerkId,
      profile_id: entry.profileId,
      path: entry.path,
      granted: entry.isAdmin,
    });
  } catch {
    // Audit must never block authorization; table may not exist yet.
  }
}

export async function requireSuperAdmin(path = "unknown"): Promise<AdminCheck> {
  if (clerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      const denied: AdminCheck = {
        clerkId: null,
        profileId: null,
        isAdmin: false,
      };
      await auditAdminCheck({ ...denied, path });
      throw new Error("UNAUTHORIZED");
    }
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const role = (clerkUser.privateMetadata as { role?: unknown })?.role;
      if (role === "SUPER_ADMIN") {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("clerk_user_id", userId)
          .maybeSingle();
        const ok: AdminCheck = {
          clerkId: userId,
          profileId: profile?.id ?? null,
          isAdmin: true,
        };
        await auditAdminCheck({ ...ok, path });
        return ok;
      }
    } catch {
      // Fall through to deny — never fail open on Clerk outage.
    }
    const denied: AdminCheck = { clerkId: userId, profileId: null, isAdmin: false };
    await auditAdminCheck({ ...denied, path });
    throw new Error("FORBIDDEN");
  }

  // Legacy mode: profiles.role is the only source (documented, temporary).
  const { requireLegacyUser } = await import("@/lib/supabase/legacy-server");
  const { supabase, user } = await requireLegacyUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "SUPER_ADMIN") {
    const ok: AdminCheck = {
      clerkId: null,
      profileId: profile.id,
      isAdmin: true,
    };
    await auditAdminCheck({ ...ok, path });
    return ok;
  }
  await auditAdminCheck({
    clerkId: null,
    profileId: profile?.id ?? user.id,
    isAdmin: false,
    path,
  });
  throw new Error("FORBIDDEN");
}
