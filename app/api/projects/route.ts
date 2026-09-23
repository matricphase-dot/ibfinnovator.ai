import {NextRequest,NextResponse} from 'next/server';import {createClient,requireUser} from '@/lib/supabase/server';import {apiError,parseBody} from '@/lib/api';import {z} from 'zod';
const schema=z.object({title:z.string().min(3).max(120),description:z.string().min(20).max(10000),required_skills:z.array(z.string()).min(1).max(20),domain:z.string().max(80).optional(),stage:z.string().max(40).optional(),problem_statement:z.string().optional(),solution_overview:z.string().optional(),engagement_type:z.string().optional(),commitment_hours:z.number().int().min(1).max(80).optional(),duration_weeks:z.number().int().min(1).max(260).optional()});
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

export async function POST(req:NextRequest){try{const {supabase,user}=await requireUser();const parsed=await parseBody(req,schema);if('response' in parsed)return parsed.response;const {data,error}=await supabase.from('projects').insert({...parsed.data,founder_id:user.id}).select().single();if(error)throw error;return NextResponse.json(data,{status:201})}catch(e){return apiError(e,'projects:POST')}}
