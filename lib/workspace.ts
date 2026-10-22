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
  preferredWorkspaceId?: string | null,
): Promise<Workspace | null> {
  if (!userId) return null;

  // 0. If a preferred workspace was requested, verify user has membership or ownership
  if (preferredWorkspaceId) {
    const { data: preferredMembership } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(*)")
      .eq("workspace_id", preferredWorkspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (preferredMembership?.workspace) {
      return preferredMembership.workspace as unknown as Workspace;
    }

    const { data: preferredOwned } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", preferredWorkspaceId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (preferredOwned) {
      await supabase
        .from("workspace_members")
        .upsert(
          { workspace_id: preferredOwned.id, user_id: userId, role: "owner" },
          { onConflict: "workspace_id,user_id" },
        );
      return preferredOwned as Workspace;
    }
  }

  // 1. Try to find workspace where user is an accepted member
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
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

  // 2. Try primary community workspace (if accessible)
  const { data: communityWs } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", "ibf-community")
    .maybeSingle();

  if (communityWs) {
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

  const rawName = (profile?.name || profile?.username || "Personal").trim();
  const baseName = rawName.slice(0, 50) || "Personal";

  let cleanPrefix = (profile?.username || `user-${userId.substring(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleanPrefix || cleanPrefix.length < 2) {
    cleanPrefix = `user-${userId.substring(0, 8)}`;
  }

  const entropy = Math.random().toString(36).substring(2, 7);
  const uniqueSlug = `${cleanPrefix}-ws-${entropy}`;

  const { data: created, error: createErr } = await supabase
    .from("workspaces")
    .insert({
      name: `${baseName}'s Workspace`,
      slug: uniqueSlug,
      owner_id: userId,
    })
    .select()
    .maybeSingle();

  if (created) {
    // Add owner to members table with upsert for idempotency
    await supabase.from("workspace_members").upsert(
      {
        workspace_id: created.id,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" },
    );

    // Initialize default #general channel for new workspace
    try {
      const { data: generalCh } = await supabase
        .from("channels")
        .insert({
          workspace_id: created.id,
          name: "general",
          description: "General workspace discussion",
          is_private: false,
          created_by: userId,
        })
        .select()
        .maybeSingle();

      if (generalCh) {
        await supabase.from("channel_members").upsert(
          { channel_id: generalCh.id, user_id: userId },
          { onConflict: "channel_id,user_id" },
        );
      }
    } catch (channelErr) {
      console.warn("Failed to create default channel for workspace:", channelErr);
    }

    return created as Workspace;
  }

  // Concurrency resilience: If insert failed (e.g. parallel request created it or slug collided),
  // re-check if a workspace already exists for this user.
  if (createErr) {
    const { data: existingOwned } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingOwned) {
      await supabase
        .from("workspace_members")
        .upsert(
          { workspace_id: existingOwned.id, user_id: userId, role: "owner" },
          { onConflict: "workspace_id,user_id" },
        );
      return existingOwned as Workspace;
    }

    // Slug collision retry with high-entropy timestamped slug
    const retrySlug = `${cleanPrefix}-ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const { data: retryCreated, error: retryErr } = await supabase
      .from("workspaces")
      .insert({
        name: `${baseName}'s Workspace`,
        slug: retrySlug,
        owner_id: userId,
      })
      .select()
      .maybeSingle();

    if (retryCreated) {
      await supabase.from("workspace_members").upsert(
        {
          workspace_id: retryCreated.id,
          user_id: userId,
          role: "owner",
        },
        { onConflict: "workspace_id,user_id" },
      );
      return retryCreated as Workspace;
    }

    console.error("Failed to create isolated personal workspace after retry:", retryErr || createErr);
  }

  return null;
}
