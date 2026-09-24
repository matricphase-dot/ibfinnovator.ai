import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { isSafeHttpsUrl } from "@/lib/security/url";
import { projectMatch } from "@/lib/matching";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
const emptyUrl = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z
    .string()
    .trim()
    .max(2048)
    .optional()
    .refine((v) => v === undefined || isSafeHttpsUrl(v), {
      message: "URL must be a valid https:// address",
    }),
);
const words = (n: number) =>
  z
    .string()
    .refine(
      (v) => v.trim().split(/\s+/).filter(Boolean).length >= n,
      `At least ${n} words required`,
    );
const base = {
  name: z.string().trim().min(2),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/),
  linkedin_url: emptyUrl,
  github_url: emptyUrl,
  availability: z.string().min(1),
  timezone: z.string().min(1),
};
const role = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  skills: z.array(z.string().min(1)).min(1),
  engagement: z.enum(["EQUITY", "STIPEND", "VOLUNTEER"]),
  equity_range: z.string().optional(),
  stipend_range: z.string().optional(),
  hours: z.number().int().positive().max(80),
  duration: z.number().int().positive().max(260),
});
const founder = z.object({
  ...base,
  company: z.string().optional(),
  past_ventures: z.string().optional(),
  industry: z.string().optional(),
  startup_name: z.string().min(3),
  tagline: z.string().optional(),
  domain: z.string().min(1),
  stage: z.enum(["IDEA", "MVP", "BETA", "REVENUE", "FUNDED"]),
  problem: words(100),
  solution: words(100),
  roles: z.array(role).min(1),
});
const skill = z.object({
  name: z.string().trim().min(1),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
});
const student = z.object({
  ...base,
  college: z.string().min(2),
  education_year: z.enum([
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "Graduate",
    "Other",
  ]),
  skills: z.array(skill).min(1),
  interests: z.array(z.string().min(1)).min(1),
  preferred_role: z.string().min(1),
  goals: words(50),
  portfolio_urls: z
    .array(
      z.string().trim().max(2048).refine(isSafeHttpsUrl, {
        message: "URL must be a valid https:// address",
      }),
    )
    .default([]),
  resume_url: emptyUrl,
});
export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireUser();
    const body = await req.json();
    const envelope = z
      .object({
        action: z.enum(["preview", "finalize"]),
        role: z.enum(["FOUNDER", "STUDENT"]),
        data: z.unknown(),
      })
      .parse(body);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(
      envelope.action === "preview"
        ? `${ip}:onboarding-preview`
        : `${user.id}:onboarding-finalize`,
      envelope.action === "preview" ? 20 : 5,
      60,
    );
    if (!limit.allowed) return rateLimitResponse(limit);
    const parsed =
      envelope.role === "FOUNDER"
        ? founder.parse(envelope.data)
        : student.parse(envelope.data);
    if (envelope.action === "preview") {
      if (envelope.role === "FOUNDER") {
        const f = parsed as z.infer<typeof founder>;
        const required = [...new Set(f.roles.flatMap((r) => r.skills))];
        const { data } = await supabase
          .from("profiles")
          .select("id,name,username,bio,skills,interests,availability")
          .eq("role", "STUDENT")
          .eq("suspended", false)
          .limit(10);
        const matches = (data || [])
          .map((x) => {
            const m = projectMatch(x, {
              required_skills: required,
              domain: f.domain,
              commitment_hours: Math.max(...f.roles.map((r) => r.hours)),
              engagement_type: f.roles[0].engagement,
            });
            return {
              id: x.id,
              name: x.name,
              username: x.username,
              matchScore: m.score,
              matchReason: m.reason,
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);
        return NextResponse.json({ matches });
      }
      const s = parsed as z.infer<typeof student>;
      const { data } = await supabase
        .from("projects")
        .select(
          "id,title,required_skills,domain,commitment_hours,engagement_type",
        )
        .eq("status", "OPEN")
        .limit(10);
      const profile = {
        skills: s.skills.map((x) => x.name),
        interests: s.interests,
        availability: s.availability,
        engagement_preferences: [],
      };
      const matches = (data || [])
        .map((x) => {
          const m = projectMatch(profile, x);
          return {
            id: x.id,
            title: x.title,
            matchScore: m.score,
            matchReason: m.reason,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
      return NextResponse.json({ matches });
    }
    const f =
        envelope.role === "FOUNDER"
          ? (parsed as z.infer<typeof founder>)
          : null,
      s =
        envelope.role === "STUDENT"
          ? (parsed as z.infer<typeof student>)
          : null;
    const params = {
      p_role: envelope.role,
      p_name: parsed.name,
      p_company: f?.company || "",
      p_linkedin_url: parsed.linkedin_url || "",
      p_github_url: parsed.github_url || "",
      p_availability: parsed.availability,
      p_timezone: parsed.timezone,
      p_past_ventures: f?.past_ventures || "",
      p_industry: f?.industry || "",
      p_startup_name: f?.startup_name || "",
      p_tagline: f?.tagline || "",
      p_domain: f?.domain || "",
      p_stage: f?.stage || "",
      p_problem: f?.problem || "",
      p_solution: f?.solution || "",
      p_roles: f?.roles || [],
      p_college: s?.college || "",
      p_education_year: s?.education_year || "",
      p_skills: s?.skills || [],
      p_interests: s?.interests || [],
      p_preferred_role: s?.preferred_role || "",
      p_goals: s?.goals || "",
      p_portfolio_urls: s?.portfolio_urls || [],
      p_resume_url: s?.resume_url || "",
      p_username: parsed.username,
    };
    const { data, error } = await supabase.rpc("finalize_onboarding", params);
    if (error) throw error;
    return NextResponse.json({
      ok: true,
      result: data,
      redirect: "/dashboard",
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      const issue = e.errors[0];
      const path = issue.path.join(" → ");
      const msg = issue.message;
      return NextResponse.json(
        { error: `${path ? `${path}: ` : ""}${msg}` },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: e?.message || "Onboarding failed" },
      { status: e?.message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
