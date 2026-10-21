import {NextRequest,NextResponse} from 'next/server';import {createClient,requireUser} from '@/lib/supabase/server';import {apiError,parseBody} from '@/lib/api';import {z} from 'zod';
import { getActiveWorkspace } from "@/lib/workspace";

const schema = z.object({
  title: z.string().min(2).max(120),
  name: z.string().min(2).max(120).optional(),
  identifier: z.string().min(2).max(10).optional(),
  workspace_id: z.string().uuid().optional().nullable(),
  description: z.string().min(10).max(10000).optional().default("Project workspace on Innovators.ai"),
  required_skills: z.array(z.string()).min(1).max(20).optional().default(["Engineering", "Architecture"]),
  domain: z.string().max(80).optional().default("Technology"),
  stage: z.string().max(40).optional().default("BUILDING"),
  problem_statement: z.string().optional(),
  solution_overview: z.string().optional(),
  engagement_type: z.string().optional(),
  commitment_hours: z.number().int().min(1).max(80).optional(),
  duration_weeks: z.number().int().min(1).max(260).optional(),
});
export async function GET(req: NextRequest) {
  try {
    const s = await createClient();
    const rawQ = req.nextUrl.searchParams.get("search");
    const cleanQ = rawQ
      ? rawQ.replace(/[%,"'()*.[\]]/g, "").trim().slice(0, 80)
      : null;

    let query = s
      .from("projects")
      .select("*,founder:profiles!founder_id(id,name,avatar_url,average_rating)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (cleanQ) {
      query = query.or(
        `title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%,domain.ilike.%${cleanQ}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
    return NextResponse.json({ projects: data || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const parsed = await parseBody(req, schema);
    if ("response" in parsed) return parsed.response;

    const body = parsed.data;
    const title = body.title.trim();
    const name = body.name?.trim() || title;
    const identifier = (body.identifier?.trim() || title.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, "") || "INN";

    let workspaceId = body.workspace_id;
    if (!workspaceId) {
      const activeWs = await getActiveWorkspace(supabase, user.id);
      workspaceId = activeWs?.id || null;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...body,
        title,
        name,
        identifier,
        workspace_id: workspaceId,
        founder_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e, "projects:POST");
  }
}

