import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminCheck = {
  profileId: string | null;
  isAdmin: boolean;
};

async function auditAdminCheck(
  entry: AdminCheck & { path: string },
): Promise<void> {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      profile_id: entry.profileId,
      path: entry.path,
      granted: entry.isAdmin,
    });
  } catch {
    // Audit must never block authorization
  }
}

export async function requireSuperAdmin(path = "unknown"): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const denied: AdminCheck = { profileId: null, isAdmin: false };
    await auditAdminCheck({ ...denied, path });
    throw new Error("UNAUTHORIZED");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "SUPER_ADMIN") {
    const ok: AdminCheck = { profileId: profile.id, isAdmin: true };
    await auditAdminCheck({ ...ok, path });
    return ok;
  }

  await auditAdminCheck({
    profileId: profile?.id ?? user.id,
    isAdmin: false,
    path,
  });
  throw new Error("FORBIDDEN");
}
