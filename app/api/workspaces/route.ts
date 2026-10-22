import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug may contain only lowercase letters, numbers, and dashes").optional(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();

    const { data: memberWorkspaces, error } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(*), role")
      .eq("user_id", user.id);

    if (error) throw error;

    const workspaces = (memberWorkspaces || [])
      .map((m: any) => ({
        ...m.workspace,
        membership_role: m.role,
      }))
      .filter(Boolean);

    return NextResponse.json({ workspaces });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid workspace payload" },
        { status: 400 }
      );
    }

    const { name } = parsed.data;
    const generatedSlug = (parsed.data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) + "-" + Math.random().toString(36).slice(2, 6);

    const { data: newWorkspace, error: createError } = await supabase
      .from("workspaces")
      .insert({
        name: name.trim(),
        slug: generatedSlug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add owner to members table with upsert for idempotency
    await supabase.from("workspace_members").upsert(
      {
        workspace_id: newWorkspace.id,
        user_id: user.id,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" },
    );

    // Initialize default #general channel
    try {
      const { data: genCh } = await supabase
        .from("channels")
        .insert({
          workspace_id: newWorkspace.id,
          name: "general",
          description: "General workspace discussion",
          is_private: false,
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (genCh) {
        await supabase.from("channel_members").upsert(
          { channel_id: genCh.id, user_id: user.id },
          { onConflict: "channel_id,user_id" },
        );
      }
    } catch (channelErr) {
      console.warn("Failed to create default channel for workspace:", channelErr);
    }

    return NextResponse.json({ workspace: newWorkspace }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create workspace" },
      { status: 500 }
    );
  }
}
