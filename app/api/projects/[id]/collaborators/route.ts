import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";

/**
 * GET /api/projects/<id>/collaborators
 *   -> { is_founder, collaborators: [{ id, name }] }
 *
 * The members a founder can award a badge or certificate to: accepted
 * connections on the project, excluding the caller. The client cannot derive
 * this on its own without knowing which side of each connection it is on.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  const { id } = await params;

  try {
    const { data: project } = await supabase
      .from("projects")
      .select("founder_id")
      .eq("id", id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const { data } = await supabase
      .from("connections")
      .select(
        "requester_id,recipient_id,requester:profiles!requester_id(id,name),recipient:profiles!recipient_id(id,name)",
      )
      .eq("project_id", id)
      .eq("status", "ACCEPTED");

    // PostgREST to-one embeds are objects at runtime; the generated types widen
    // them to arrays, so narrow once here.
    type Profile = { id: string; name: string | null };
    type Row = {
      requester_id: string;
      recipient_id: string;
      requester: Profile | null;
      recipient: Profile | null;
    };
    const rows = (data ?? []) as unknown as Row[];

    const seen = new Set<string>();
    const collaborators: { id: string; name: string }[] = [];

    for (const row of rows) {
      const other =
        row.requester_id === user.id ? row.recipient : row.requester;
      const otherId = row.requester_id === user.id ? row.recipient_id : row.requester_id;
      if (!other?.id || other.id === user.id || seen.has(otherId)) continue;
      seen.add(otherId);
      collaborators.push({ id: other.id, name: other.name ?? "IBF member" });
    }

    return NextResponse.json({
      is_founder: project.founder_id === user.id,
      collaborators,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unable to load collaborators." },
      { status: 400 },
    );
  }
}
