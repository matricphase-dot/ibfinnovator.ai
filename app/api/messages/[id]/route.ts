import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("EDIT"),
    content: z.string().trim().min(1).max(5000),
  }),
  z.object({ action: z.literal("DELETE") }),
]);
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase, user } = await requireUser(),
      p = input.parse(await req.json());
    const { data: m, error: readError } = await supabase
      .from("messages")
      .select("id,sender_id,content,deleted_at")
      .eq("id", id)
      .single();
    if (readError || !m)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (m.sender_id !== user.id)
      return NextResponse.json(
        { error: "You can only modify your own messages" },
        { status: 403 },
      );
    if (m.deleted_at)
      return NextResponse.json(
        { error: "Message already deleted" },
        { status: 409 },
      );
    if (p.action === "EDIT") {
      const { error: historyError } = await supabase
        .from("message_edits")
        .insert({
          message_id: id,
          editor_id: user.id,
          previous_content: m.content,
        });
      if (historyError) throw historyError;
      const { data, error } = await supabase
        .from("messages")
        .update({
          content: p.content,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }
    const { data, error } = await supabase
      .from("messages")
      .update({
        content: "Message deleted",
        attachments: [],
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unable to modify message" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
