import { SupabaseClient } from "@supabase/supabase-js";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export async function getActiveWorkspace(
  supabase: SupabaseClient,
  userId: string,
): Promise<Workspace | null> {
  // 1. Try to find workspace where user is an accepted member or owner
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(*)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership?.workspace) {
    return membership.workspace as unknown as Workspace;
  }

  // 1b. Check if user owns any workspace directly
  const { data: ownedWs } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownedWs) {
    await supabase
      .from("workspace_members")
      .upsert(
        { workspace_id: ownedWs.id, user_id: userId, role: "owner" },
        { onConflict: "workspace_id,user_id" },
      );
    return ownedWs as Workspace;
  }

  // 2. Try primary community workspace
  const { data: communityWs } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", "ibf-community")
    .maybeSingle();

  if (communityWs) {
    // Ensure membership
    await supabase
      .from("workspace_members")
      .upsert(
        { workspace_id: communityWs.id, user_id: userId, role: "member" },
        { onConflict: "workspace_id,user_id" },
      );
    return communityWs as Workspace;
  }

  // 3. Fallback: Create an isolated personal workspace (NEVER hijack another tenant's workspace)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", userId)
    .maybeSingle();

  const baseName = profile?.name?.trim() || profile?.username?.trim() || "Personal";
  const userPrefix = (profile?.username || `user-${userId.substring(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const uniqueSlug = `${userPrefix}-ws`;

  const { data: created, error: createErr } = await supabase
    .from("workspaces")
    .insert({
      name: `${baseName}'s Workspace`,
      slug: uniqueSlug,
      owner_id: userId,
    })
    .select()
    .single();

  if (created) {
    await supabase.from("workspace_members").insert({
      workspace_id: created.id,
      user_id: userId,
      role: "owner",
    });
    return created as Workspace;
  }

  if (createErr) {
    console.error("Failed to create isolated personal workspace:", createErr);
  }

  return null;
}
