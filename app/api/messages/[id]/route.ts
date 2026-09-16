import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Edit and delete for a single message.
 *
 * Soft delete only: there is no DELETE policy on public.messages, so a hard
 * delete is impossible by design. Both handlers additionally filter on
 * `sender_id = caller`, because the team-room UPDATE policy (migration 013)
 * lets any room member update rows — RLS alone would let a teammate edit
 * somebody else's message.
 */

const patchSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
    }

    const auth = await requireUserOr401();
    if (auth.response) return auth.response;
    const { supabase, user } = auth.session;
    const { content } = patchSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", id)
      .eq("sender_id", user.id)
      .select("*,sender:profiles!sender_id(id,name,avatar_url)")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "You can only edit your own messages." },
        { status: 403 },
      );
    }
    return NextResponse.json(data);
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Unable to edit message." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
    }

    const auth = await requireUserOr401();
    if (auth.response) return auth.response;
    const { supabase, user } = auth.session;

    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString(), content: "" })
      .eq("id", id)
      .eq("sender_id", user.id)
      .select("id,created_at,edited_at,deleted_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "You can only delete your own messages." },
        { status: 403 },
      );
    }
    return NextResponse.json({ deleted: true, id: data.id });
  } catch (e: any) {
    const unauthorized = e?.message === "UNAUTHORIZED" || e?.message === "PROFILE_NOT_FOUND";
    return NextResponse.json(
      { error: e?.message ?? "Unable to delete message." },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
