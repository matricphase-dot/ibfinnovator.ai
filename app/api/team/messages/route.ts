import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { safeHttpsUrlSchema } from "@/lib/security/url";
import { z } from "zod";import {checkRateLimit,rateLimitResponse} from '@/lib/rate-limit';
const schema = z.object({
  room_id: z.string().uuid(),
  channel: z.string().max(80).default("General"),
  content: z.string().trim().min(1).max(5000),
  parent_id: z.string().uuid().optional(),
  attachments: z.array(safeHttpsUrlSchema()).max(10).default([]),
});
export async function POST(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const limit = checkRateLimit(`${user.id}:team-messages`, 60, 60);
    if (!limit.allowed) return rateLimitResponse(limit);
    const p = schema.parse(await r.json());

    // Verify user has access to this team room
    const { data: canAccess, error: accessErr } = await supabase.rpc(
      "can_access_team_room",
      { target_room: p.room_id },
    );
    if (accessErr || !canAccess) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this team room" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: p.room_id,
        sender_id: user.id,
        room_type: "TEAM",
        channel: p.channel,
        content: p.content,
        parent_id: p.parent_id,
        attachments: p.attachments,
      })
      .select("*,sender:profiles!sender_id(id,name,username,avatar_url)")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function PATCH(r: Request) {
  try {
    const { supabase, user } = await requireUser();
    const p = z
      .object({
        id: z.string().uuid(),
        pinned: z.boolean().optional(),
        content: z.string().trim().min(1).max(5000).optional(),
      })
      .parse(await r.json());

    if (p.pinned === undefined && p.content === undefined) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("messages")
      .select("id, sender_id, room_id, room_type")
      .eq("id", p.id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Rule 1: Only the original sender may edit content
    if (p.content !== undefined && existing.sender_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the message author can edit content" },
        { status: 403 },
      );
    }

    // Rule 2: Only room admins/leads/founders can pin/unpin messages
    if (p.pinned !== undefined) {
      if (existing.room_type === "TEAM" && existing.room_id) {
        const [{ data: membership }, { data: room }] = await Promise.all([
          supabase
            .from("team_members")
            .select("role")
            .eq("room_id", existing.room_id)
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("team_rooms")
            .select("project:projects(founder_id)")
            .eq("id", existing.room_id)
            .maybeSingle(),
        ]);

        const founderId = (room as any)?.project?.founder_id;
        const isPrivileged =
          membership?.role === "ADMIN" ||
          membership?.role === "LEAD" ||
          founderId === user.id ||
          user.role === "SUPER_ADMIN";

        if (!isPrivileged) {
          return NextResponse.json(
            { error: "Forbidden: Only room admins or project leads can pin messages" },
            { status: 403 },
          );
        }
      } else {
        if (user.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { error: "Forbidden: Only administrators can pin global messages" },
            { status: 403 },
          );
        }
      }
    }

    const updates: Record<string, any> = {};
    if (p.content !== undefined) updates.content = p.content;
    if (p.pinned !== undefined) updates.pinned = p.pinned;

    const { data, error } = await supabase
      .from("messages")
      .update(updates)
      .eq("id", p.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

