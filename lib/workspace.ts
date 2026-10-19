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

  // 3. Fallback: retrieve any existing workspace or create one
  const { data: anyWs } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (anyWs) {
    await supabase
      .from("workspace_members")
      .upsert(
        { workspace_id: anyWs.id, user_id: userId, role: "member" },
        { onConflict: "workspace_id,user_id" },
      );
    return anyWs as Workspace;
  }

  const { data: created } = await supabase
    .from("workspaces")
    .insert({
      name: "IBF Community",
      slug: "ibf-community",
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

  return null;
}
