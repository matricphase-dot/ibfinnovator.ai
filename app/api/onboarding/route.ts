import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  projectMatch,
  type MatchProfile,
  type MatchProject,
} from "@/lib/matching";

export const runtime = "nodejs";

/* -------------------------------------------------------------------------
 * Validation
 *
 * The wizard posts the same payload for `preview` and `finalize`, so both
 * actions share one schema: what you preview is exactly what gets saved.
 * ---------------------------------------------------------------------- */

const DOMAINS = ["FinTech", "EdTech", "HealthTech", "AI-ML", "SaaS", "Climate", "Other"] as const;
const STAGES = ["Idea", "MVP", "Beta", "Revenue", "Funded"] as const;
const YEARS = ["1st", "2nd", "3rd", "4th", "Graduate", "Other"] as const;
const ENGAGEMENTS = ["EQUITY", "STIPEND", "VOLUNTEER"] as const;
const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

const wordCount = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

/** A required prose field with a minimum word count. */
const prose = (min: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => wordCount(v) >= min, (v) => ({
      message: `${label} must be at least ${min} words — currently ${wordCount(v)}.`,
    }));

/** Blank optional text becomes undefined so it never overwrites existing data. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().min(1).optional(),
);

/** Optional link. '' -> undefined, and a bare host gets an https:// prefix. */
const optionalUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  },
  z.string().url("Enter a valid link, for example https://linkedin.com/in/you").optional(),
);

/** "python, react" | ["python","react"] -> ["python","react"] */
const csv = z
  .union([z.string(), z.array(z.string())])
  .transform((v) =>
    (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean),
  );

/** One link per line -> string[] with https:// filled in. */
const urlLines = z
  .preprocess(
    (v) =>
      typeof v === "string"
        ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : v,
    z.array(z.string().min(1)).optional(),
  )
  .transform((arr) =>
    arr?.map((s) => (/^https?:\/\//i.test(s) ? s : `https://${s}`)),
  );

const username = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z
    .string()
    .regex(
      /^[a-z0-9_]{3,30}$/,
      "Username must be 3-30 characters using lowercase letters, numbers or underscore",
    ),
);

const identity = z.object({
  name: z.string().trim().min(1, "Your display name is required").max(80),
  username,
});

const openRole = z.object({
  title: z.string().trim().min(2, "Each role needs a title"),
  description: z
    .string()
    .trim()
    .min(10, "Each role description must be at least 10 characters"),
  skills: csv,
  engagement: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
    z.enum(ENGAGEMENTS, { message: "Pick EQUITY, STIPEND or VOLUNTEER" }),
  ),
  hours: z.coerce
    .number()
    .int("Hours must be a whole number")
    .min(1, "Hours must be at least 1")
    .max(80, "Hours must be 80 or less"),
  duration: z.coerce
    .number()
    .int("Duration must be a whole number of weeks")
    .min(1, "Duration must be at least 1 week")
    .max(104, "Duration must be 104 weeks or less"),
});

const founderSchema = identity.extend({
  company: optionalText,
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  availability: optionalText,
  timezone: optionalText,
  past_ventures: optionalText,
  industry: optionalText,
  startup_name: z.string().trim().min(2, "Your startup needs a name"),
  tagline: optionalText,
  domain: z.enum(DOMAINS, { message: "Pick a domain" }),
  stage: z.enum(STAGES, { message: "Pick a stage" }),
  problem: prose(100, "The problem statement"),
  solution: prose(100, "The solution overview"),
  roles: z.array(openRole).min(1, "Add at least one open role"),
});

const studentSchema = identity.extend({
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  college: z.string().trim().min(2, "College is required"),
  education_year: z.enum(YEARS, { message: "Pick your year" }),
  availability: optionalText,
  timezone: optionalText,
  proficiency: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Skill name cannot be empty"),
        proficiency: z.enum(PROFICIENCIES, { message: "Pick a skill level" }),
      }),
    )
    .min(1, "Add at least one skill"),
  interests: csv,
  preferred_role: optionalText,
  goals: prose(50, "Your goals"),
  portfolio_urls: urlLines,
  resume_url: optionalUrl,
});

const envelopeSchema = z.object({
  action: z.enum(["preview", "finalize"], { message: "action must be preview or finalize" }),
  role: z.enum(["FOUNDER", "STUDENT"]).optional(),
  data: z.unknown(),
});

type Role = "FOUNDER" | "STUDENT";

/* -------------------------------------------------------------------------
 * Preview scoring — read-only, never writes
 * ---------------------------------------------------------------------- */

const profileShape = (row: any): MatchProfile => ({
  skills: row.skills ?? [],
  interests: row.interests ?? [],
  availability: row.availability ?? null,
  engagement_preferences: row.engagement_preferences ?? [],
});

const projectShape = (row: any): MatchProject => ({
  required_skills: row.required_skills ?? [],
  domain: row.domain ?? null,
  commitment_hours: row.commitment_hours ?? null,
  engagement_type: row.engagement_type ?? null,
});

async function buildPreview(role: Role, d: any) {
  try {
    if (role === "STUDENT") {
      // Score my draft profile against every open project on the platform.
      const me: MatchProfile = {
        skills: (d.proficiency ?? []).map((s: any) => s.name),
        interests: d.interests ?? [],
        availability: d.availability ?? null,
        engagement_preferences: [],
      };

      const { data: projects, error } = await supabaseAdmin
        .from("projects")
        .select(
          "id,title,domain,stage,required_skills,commitment_hours,engagement_type,founder:profiles!founder_id(name)",
        )
        .eq("status", "OPEN")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;

      const matches = (projects ?? [])
        .map((project: any) => {
          const scored = projectMatch(me, projectShape(project));
          return {
            id: project.id,
            title: project.title,
            subtitle: [project.founder?.name, project.domain, project.stage]
              .filter(Boolean)
              .join(" · "),
            matchScore: scored.score,
            matchReason: scored.reason,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      return { matches };
    }

    // FOUNDER: score every onboarded student against my open roles and keep
    // each student's best-fitting role.
    const roleTargets = (d.roles ?? []).map((r: any) => ({
      title: r.title as string,
      project: {
        required_skills: r.skills ?? [],
        domain: d.domain ?? null,
        commitment_hours: r.hours ?? null,
        engagement_type: r.engagement ?? null,
      } as MatchProject,
    }));

    const { data: students, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,name,college,education_year,preferred_role,skills,interests,availability,engagement_preferences",
      )
      .eq("role", "STUDENT")
      .eq("onboarding_completed", true)
      .limit(60);
    if (error) throw error;

    const matches = (students ?? [])
      .map((student: any) => {
        let bestRole = roleTargets[0]?.title ?? "Open role";
        let best = { score: 0, reason: "Potential growth match" };
        for (const target of roleTargets) {
          const scored = projectMatch(profileShape(student), target.project);
          if (scored.score > best.score) {
            best = { score: scored.score, reason: scored.reason };
            bestRole = target.title;
          }
        }
        return {
          id: student.id,
          title: student.name || "IBF member",
          subtitle: [student.college, student.education_year, student.preferred_role]
            .filter(Boolean)
            .join(" · "),
          matchScore: best.score,
          matchReason: `${bestRole} · ${best.reason}`,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    return { matches };
  } catch (error) {
    // A preview is a nicety; never let it block someone from finishing.
    console.error("[onboarding] preview failed:", error);
    return {
      matches: [],
      notice:
        "We couldn't load matches just now. You can still finish — they'll appear on your dashboard.",
    };
  }
}

/* -------------------------------------------------------------------------
 * RPC parameter mapping — p_role and identity come from the session only
 * ---------------------------------------------------------------------- */

function rpcParams(role: Role, d: any) {
  const founder = role === "FOUNDER";
  return {
    p_role: role,
    p_name: d.name,
    p_username: d.username,
    p_linkedin_url: d.linkedin_url ?? null,
    p_github_url: d.github_url ?? null,
    p_availability: d.availability ?? null,
    p_timezone: d.timezone ?? null,
    p_interests: d.interests?.length ? d.interests : null,

    p_company: founder ? d.company ?? null : null,
    p_past_ventures: founder ? d.past_ventures ?? null : null,
    p_industry: founder ? d.industry ?? null : null,
    p_startup_name: founder ? d.startup_name : null,
    p_tagline: founder ? d.tagline ?? null : null,
    p_domain: founder ? d.domain : null,
    p_stage: founder ? d.stage : null,
    p_problem: founder ? d.problem : null,
    p_solution: founder ? d.solution : null,
    p_roles: founder ? d.roles : null,

    p_college: founder ? null : d.college,
    p_education_year: founder ? null : d.education_year,
    p_proficiency: founder ? null : d.proficiency,
    p_preferred_role: founder ? null : d.preferred_role ?? null,
    p_goals: founder ? null : d.goals,
    p_portfolio_urls: founder ? null : d.portfolio_urls?.length ? d.portfolio_urls : null,
    p_resume_url: founder ? null : d.resume_url ?? null,
  };
}

/* -------------------------------------------------------------------------
 * Handler
 * ---------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  // 1. Session first — identity is never taken from the request body.
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const role: Role =
    session.user.role === "FOUNDER" || session.user.role === "SUPER_ADMIN"
      ? "FOUNDER"
      : "STUDENT";

  // 2. Envelope
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const envelope = envelopeSchema.safeParse(payload);
  if (!envelope.success) {
    return NextResponse.json(
      { error: envelope.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  if (envelope.data.role && envelope.data.role !== role) {
    return NextResponse.json(
      {
        error: `Your account is set up as ${role}, but the form was submitted as ${envelope.data.role}. Reload the page and try again.`,
      },
      { status: 409 },
    );
  }

  // 3. Role-specific payload — identical rules for preview and finalize.
  const parsed = (role === "FOUNDER" ? founderSchema : studentSchema).safeParse(
    envelope.data.data ?? {},
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check the highlighted fields",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (envelope.data.action === "preview") {
    const { matches, notice } = await buildPreview(role, parsed.data);
    return NextResponse.json(notice ? { matches, notice } : { matches });
  }

  // 4. Finalize — the RPC derives the user from the JWT, so a caller can only
  //    ever write to their own profile.
  const { data: result, error } = await session.supabase.rpc(
    "finalize_onboarding",
    rpcParams(role, parsed.data),
  );

  if (error) {
    if ((error as any).code === "23505") {
      return NextResponse.json(
        { error: "That username is already taken — please choose another." },
        { status: 409 },
      );
    }
    const message = error.message || "Could not save your onboarding";
    const status = /not authenticated/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true, redirect: "/dashboard", result });
}
