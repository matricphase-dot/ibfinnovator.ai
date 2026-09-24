"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { isSafeHttpsUrl } from "@/lib/security/url";

type Role = "FOUNDER" | "STUDENT";

type Skill = {
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
};

type OpenRole = {
  title: string;
  description: string;
  skills: string;
  engagement: "EQUITY" | "STIPEND" | "VOLUNTEER";
  equity_range: string;
  stipend_range: string;
  hours: number;
  duration: number;
};

const KEY = "ibf_onboarding_draft";
const wordCount = (v = "") => v.trim().split(/\s+/).filter(Boolean).length;

const emptyRole = (): OpenRole => ({
  title: "",
  description: "",
  skills: "",
  engagement: "VOLUNTEER",
  equity_range: "",
  stipend_range: "",
  hours: 10,
  duration: 12,
});

const isRoleEmpty = (r: OpenRole): boolean => {
  return (
    !r.title?.trim() &&
    !r.description?.trim() &&
    !r.skills?.trim() &&
    !r.equity_range?.trim() &&
    !r.stipend_range?.trim()
  );
};

export default function OnboardingWizard({
  initialRole,
}: {
  initialRole?: Role;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(initialRole || "STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [data, setData] = useState<any>({
    name: "",
    username: "",
    linkedin_url: "",
    github_url: "",
    availability: "",
    timezone: "",
    company: "",
    past_ventures: "",
    industry: "",
    startup_name: "",
    tagline: "",
    domain: "",
    stage: "IDEA",
    problem: "",
    solution: "",
    roles: [emptyRole()],
    college: "",
    education_year: "",
    skills: [{ name: "", proficiency: "Beginner" } as Skill],
    interests: "",
    preferred_role: "",
    goals: "",
    portfolio_urls: "",
    resume_url: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const x = JSON.parse(saved);
        if (x && typeof x === "object" && x.data && typeof x.data === "object") {
          setData((d: any) => ({ ...d, ...x.data }));
          if (x.role === "FOUNDER" || x.role === "STUDENT" || !initialRole) {
            setRole(x.role || initialRole || "STUDENT");
          }
          const s = Number(x.step);
          if (Number.isFinite(s)) setStep(Math.max(1, Math.min(5, s)));
        } else {
          localStorage.removeItem(KEY);
        }
      } catch {
        try {
          localStorage.removeItem(KEY);
        } catch {}
      }
    }

    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) {
          if (p.role === "FOUNDER" || p.role === "STUDENT") setRole(p.role);
          setData((d: any) => ({
            ...d,
            name: d.name || p.name || "",
            username: d.username || p.username || "",
            company: d.company || p.company || "",
            availability: d.availability || p.availability || "",
            timezone: d.timezone || p.timezone || "",
            college: d.college || p.college || "",
            education_year: d.education_year || p.education_year || "",
            linkedin_url: d.linkedin_url || p.linkedin_url || "",
            github_url: d.github_url || p.github_url || "",
          }));
        }
      });
  }, [initialRole]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ step, role, data }));
  }, [step, role, data]);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));

  function validate(): string {
    setError("");
    if (step === 1) {
      if (data.name.trim().length < 2) return "Enter your full name (at least 2 characters).";
      if (!/^[a-z0-9_]{3,30}$/.test(data.username))
        return "Username must use 3–30 lowercase letters, numbers, or underscores.";
    }

    if (role === "FOUNDER") {
      if (step === 2 && (!data.availability || !data.timezone))
        return "Availability and timezone are required.";
      if (step === 3) {
        if (!data.startup_name?.trim() || !data.domain?.trim() || !data.stage?.trim())
          return "Complete the startup name, domain, and stage.";
        const probWords = wordCount(data.problem);
        if (probWords < 100)
          return `Problem statement must contain at least 100 words (currently ${probWords}/100).`;
        const solWords = wordCount(data.solution);
        if (solWords < 100)
          return `Solution overview must contain at least 100 words (currently ${solWords}/100).`;
      }
      if (step === 4) {
        const nonEmptyRoles = data.roles.filter((r: OpenRole) => !isRoleEmpty(r));
        if (nonEmptyRoles.length === 0) {
          return "Please define at least one open role for your startup brief.";
        }

        for (let i = 0; i < data.roles.length; i++) {
          const r = data.roles[i];
          // If completely untouched and other roles exist, it will be pruned on submission
          if (isRoleEmpty(r)) {
            continue;
          }
          const roleLabel = `Role #${i + 1}${r.title?.trim() ? ` ("${r.title.trim()}")` : ""}`;
          if (!r.title?.trim() || r.title.trim().length < 3) {
            return `${roleLabel}: Role title must be at least 3 characters.`;
          }
          if (!r.skills?.trim()) {
            return `${roleLabel}: Please specify at least one required skill (comma-separated).`;
          }
          const descLen = r.description?.trim().length || 0;
          if (descLen < 10) {
            return `${roleLabel}: Description must be at least 10 characters (currently ${descLen}/10).`;
          }
          if (Number(r.hours) < 1 || Number(r.hours) > 80) {
            return `${roleLabel}: Hours per week must be between 1 and 80.`;
          }
          if (Number(r.duration) < 1 || Number(r.duration) > 260) {
            return `${roleLabel}: Duration must be between 1 and 260 weeks.`;
          }
        }
      }
    } else {
      if (step === 2 && (!data.college?.trim() || !data.education_year?.trim()))
        return "College and education year are required.";
      if (step === 3) {
        if (!data.skills.length || data.skills.some((s: Skill) => !s.name?.trim()))
          return "Add at least one skill with a non-empty name.";
        if (
          !data.interests?.trim() ||
          !data.preferred_role?.trim() ||
          !data.availability?.trim() ||
          !data.timezone?.trim()
        )
          return "Complete interests, role, availability, and timezone.";
        const goalWords = wordCount(data.goals);
        if (goalWords < 50)
          return `Collaboration goals must contain at least 50 words (currently ${goalWords}/50).`;
      }
      if (step === 4) {
        if (data.resume_url?.trim() && !isSafeHttpsUrl(data.resume_url.trim())) {
          return "Resume URL must be a valid https:// address.";
        }
      }
    }
    return "";
  }

  function payload() {
    if (role === "FOUNDER") {
      const activeRoles = data.roles.filter((r: OpenRole) => !isRoleEmpty(r));
      const rolesToSubmit = activeRoles.length > 0 ? activeRoles : data.roles;
      return {
        ...data,
        name: data.name.trim(),
        username: data.username.trim().toLowerCase(),
        startup_name: data.startup_name.trim(),
        problem: data.problem.trim(),
        solution: data.solution.trim(),
        domain: data.domain.trim(),
        stage: data.stage.trim(),
        roles: rolesToSubmit.map((r: OpenRole) => ({
          title: r.title.trim(),
          description: r.description.trim(),
          skills: r.skills
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          engagement: r.engagement || "VOLUNTEER",
          equity_range: r.equity_range?.trim() || undefined,
          stipend_range: r.stipend_range?.trim() || undefined,
          hours: Math.max(1, Math.min(80, Number(r.hours) || 10)),
          duration: Math.max(1, Math.min(260, Number(r.duration) || 12)),
        })),
      };
    }
    return {
      ...data,
      name: data.name.trim(),
      username: data.username.trim().toLowerCase(),
      interests: data.interests
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean),
      skills: data.skills
        .filter((s: Skill) => s.name?.trim())
        .map((s: Skill) => ({
          name: s.name.trim(),
          proficiency: s.proficiency || "Beginner",
        })),
      portfolio_urls: data.portfolio_urls
        .split("\n")
        .map((x: string) => x.trim())
        .filter(Boolean),
      resume_url: data.resume_url?.trim() || undefined,
    };
  }

  async function next() {
    // If founder has completely blank extra roles, prune them automatically
    if (step === 4 && role === "FOUNDER") {
      const nonEmptyRoles = data.roles.filter((r: OpenRole) => !isRoleEmpty(r));
      if (nonEmptyRoles.length > 0 && nonEmptyRoles.length !== data.roles.length) {
        set("roles", nonEmptyRoles);
      }
    }

    const err = validate();
    if (err) {
      setError(err);
      toast.error(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step === 4) {
      setLoading(true);
      setError("");
      try {
        const payloadData = payload();
        const r = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "preview", role, data: payloadData }),
        });
        const x = await r.json();
        if (!r.ok) throw new Error(x.error || "Failed to generate preview");
        setMatches(x.matches || []);
        setStep(5);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e: any) {
        const msg = e?.message || "Failed to proceed to preview";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    } else {
      setStep((s) => Math.min(5, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function finish() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finalize", role, data: payload() }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.error || "Onboarding finalization failed");
      localStorage.removeItem(KEY);
      toast.success("Onboarding complete!");
      window.location.assign(x.redirect || "/dashboard");
    } catch (e: any) {
      const msg = e?.message || "Failed to complete onboarding";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function updateRole(i: number, k: keyof OpenRole, v: any) {
    const rows = [...data.roles];
    rows[i] = { ...rows[i], [k]: v };
    set("roles", rows);
  }

  function updateSkill(i: number, k: keyof Skill, v: any) {
    const rows = [...data.skills];
    rows[i] = { ...rows[i], [k]: v };
    set("skills", rows);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hallmark Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div className="flex items-center flex-1" key={i}>
            <span
              className={`w-9 h-9 shrink-0 rounded-[2px] grid place-items-center text-xs font-mono font-medium transition ${
                i < step
                  ? "bg-[var(--deep)] text-white"
                  : i === step
                    ? "bg-[var(--accent)] text-white ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--base)] shadow-xs"
                    : "bg-[var(--hairline)] text-[var(--muted)]"
              }`}
            >
              {i < step ? <Check size={14} /> : i}
            </span>
            {i < 5 && (
              <i
                className={`h-0.5 flex-1 transition ${
                  i < step ? "bg-[var(--deep)]" : "bg-[var(--hairline)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <section className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] p-6 sm:p-9 shadow-xs">
        <p className="font-mono-eyebrow text-[10px] text-[var(--muted)]">
          {role} ONBOARDING · STEP {step} OF 5
        </p>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="my-5 p-4 bg-[#FDF1EE] border border-[#F2C5BC] rounded-[2px] text-xs text-[#9C3826] font-mono leading-relaxed flex items-start gap-2.5 shadow-xs"
          >
            <span className="font-bold text-sm">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <>
            <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
              Your IBF identity
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
              Confirm your workspace role and public builder handle.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <button
                type="button"
                onClick={() => setRole("FOUNDER")}
                className={`p-5 rounded-[2px] border text-left transition ${
                  role === "FOUNDER"
                    ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)] shadow-xs"
                    : "border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--muted)]"
                }`}
              >
                <b className="font-display text-base text-[var(--ink)]">Founder</b>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                  Post venture briefs, recruit builders, and track verified milestones.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`p-5 rounded-[2px] border text-left transition ${
                  role === "STUDENT"
                    ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)] shadow-xs"
                    : "border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--muted)]"
                }`}
              >
                <b className="font-display text-base text-[var(--ink)]">Student / Builder</b>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                  Join real projects, collaborate directly with founders, and build credentials.
                </p>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <Field
                label="Full name"
                value={data.name}
                onChange={(v) => set("name", v)}
                placeholder="Ada Lovelace"
              />
              <Field
                label="Username"
                value={data.username}
                onChange={(v) =>
                  set("username", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="ada_lovelace"
              />
            </div>
          </>
        )}

        {/* STEP 2: BACKGROUND */}
        {step === 2 &&
          (role === "FOUNDER" ? (
            <>
              <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
                Founder background
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Help builders understand your working rhythm, timezone, and background.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="Company / Studio"
                  value={data.company}
                  onChange={(v) => set("company", v)}
                  placeholder="e.g. Synapse Labs Inc."
                />
                <Field
                  label="Industry experience"
                  value={data.industry}
                  onChange={(v) => set("industry", v)}
                  placeholder="e.g. BioTech, Distributed Systems"
                />
                <Field
                  label="LinkedIn URL"
                  value={data.linkedin_url}
                  onChange={(v) => set("linkedin_url", v)}
                  placeholder="https://linkedin.com/in/username"
                />
                <Field
                  label="GitHub URL"
                  value={data.github_url}
                  onChange={(v) => set("github_url", v)}
                  placeholder="https://github.com/username"
                />
                <Select
                  label="Availability"
                  value={data.availability}
                  onChange={(v) => set("availability", v)}
                  options={["5-10 hrs/week", "10-20 hrs/week", "20+ hrs/week"]}
                />
                <Timezone
                  value={data.timezone}
                  onChange={(v) => set("timezone", v)}
                />
              </div>
              <Area
                label="Past ventures & achievements (optional)"
                value={data.past_ventures}
                onChange={(v) => set("past_ventures", v)}
                placeholder="Tell prospective builders about products you have launched or previous projects..."
              />
            </>
          ) : (
            <>
              <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
                Education & social profiles
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Connect your academic background and technical portfolios.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="College / University"
                  value={data.college}
                  onChange={(v) => set("college", v)}
                  placeholder="e.g. Stanford University"
                />
                <Select
                  label="Education year"
                  value={data.education_year}
                  onChange={(v) => set("education_year", v)}
                  options={[
                    "1st Year",
                    "2nd Year",
                    "3rd Year",
                    "4th Year",
                    "Graduate",
                    "Other",
                  ]}
                />
                <Field
                  label="LinkedIn URL"
                  value={data.linkedin_url}
                  onChange={(v) => set("linkedin_url", v)}
                  placeholder="https://linkedin.com/in/username"
                />
                <Field
                  label="GitHub URL"
                  value={data.github_url}
                  onChange={(v) => set("github_url", v)}
                  placeholder="https://github.com/username"
                />
              </div>
            </>
          ))}

        {/* STEP 3: STARTUP DETAILS / SKILLS */}
        {step === 3 &&
          (role === "FOUNDER" ? (
            <>
              <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
                Startup details & thesis
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Give builders a comprehensive view of your problem space, proposed solution, and market stage.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="Startup name"
                  value={data.startup_name}
                  onChange={(v) => set("startup_name", v)}
                  placeholder="e.g. Synapse Health"
                />
                <Field
                  label="Tagline (optional)"
                  value={data.tagline}
                  onChange={(v) => set("tagline", v)}
                  placeholder="Autonomous medical imaging triage microservice"
                />
                <Select
                  label="Domain"
                  value={data.domain}
                  onChange={(v) => set("domain", v)}
                  options={[
                    "AI/ML",
                    "BioTech & Health",
                    "CleanTech & Energy",
                    "Cryptographic Systems",
                    "EdTech",
                    "FinTech",
                    "SaaS",
                    "Other",
                  ]}
                />
                <Select
                  label="Current Stage"
                  value={data.stage}
                  onChange={(v) => set("stage", v)}
                  options={["IDEA", "MVP", "BETA", "REVENUE", "FUNDED"]}
                />
              </div>

              <Area
                label={`Problem statement (${wordCount(data.problem)}/100 words min)`}
                value={data.problem}
                onChange={(v) => set("problem", v)}
                rows={6}
                placeholder="Describe the clinical, technical, or market bottleneck you are addressing in detail (at least 100 words)..."
              />

              <Area
                label={`Solution overview (${wordCount(data.solution)}/100 words min)`}
                value={data.solution}
                onChange={(v) => set("solution", v)}
                rows={6}
                placeholder="Explain your technical architecture, expected milestones, and product implementation (at least 100 words)..."
              />
            </>
          ) : (
            <>
              <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
                Skills, interests and goals
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Declare your core technical skills, working preferences, and collaboration targets.
              </p>

              <div className="space-y-3 mt-6">
                <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                  Technical skills
                </label>
                {data.skills.map((s: Skill, i: number) => (
                  <div
                    className="grid grid-cols-[1fr_170px_40px] gap-2 items-center"
                    key={i}
                  >
                    <input
                      className="field"
                      value={s.name}
                      onChange={(e) => updateSkill(i, "name", e.target.value)}
                      placeholder="e.g. PyTorch, Next.js, Rust"
                    />
                    <select
                      className="field"
                      value={s.proficiency}
                      onChange={(e) =>
                        updateSkill(i, "proficiency", e.target.value)
                      }
                    >
                      {["Beginner", "Intermediate", "Advanced", "Expert"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                    {data.skills.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "skills",
                            data.skills.filter((_: any, n: number) => n !== i),
                          )
                        }
                        className="text-[#9C3826] hover:text-[#7A2C1D] transition p-2"
                        aria-label="Remove skill"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    set("skills", [
                      ...data.skills,
                      { name: "", proficiency: "Beginner" },
                    ])
                  }
                  className="btn bg-[var(--base)] border-[var(--hairline)] hover:border-[var(--ink)] text-xs font-mono font-medium gap-2 mt-2"
                >
                  <Plus size={14} /> Add skill
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="Interests (comma-separated)"
                  value={data.interests}
                  onChange={(v) => set("interests", v)}
                  placeholder="e.g. Computer Vision, Oncology, Systems Architecture"
                />
                <Select
                  label="Preferred role"
                  value={data.preferred_role}
                  onChange={(v) => set("preferred_role", v)}
                  options={[
                    "Developer",
                    "Designer",
                    "Product",
                    "Data",
                    "Marketing",
                    "Operations",
                    "Other",
                  ]}
                />
                <Select
                  label="Availability"
                  value={data.availability}
                  onChange={(v) => set("availability", v)}
                  options={["5-10 hrs/week", "10-20 hrs/week", "20+ hrs/week"]}
                />
                <Timezone
                  value={data.timezone}
                  onChange={(v) => set("timezone", v)}
                />
              </div>

              <Area
                label={`Collaboration goals (${wordCount(data.goals)}/50 words min)`}
                value={data.goals}
                onChange={(v) => set("goals", v)}
                rows={5}
                placeholder="What outcomes do you want to accomplish by joining a founder's workspace? (at least 50 words)..."
              />
            </>
          ))}

        {/* STEP 4: OPEN ROLES (FOUNDER) / PORTFOLIO (STUDENT) */}
        {step === 4 &&
          (role === "FOUNDER" ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mt-2">
                <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--ink)]">
                  Open roles and engagement
                </h1>
                <span className="font-mono text-xs text-[var(--muted)]">
                  Define at least 1 open role for your startup brief
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Specify what technical expertise you need, commitment hours, and compensation structure (equity, stipend, or volunteer).
              </p>

              <div className="space-y-6 mt-6">
                {data.roles.map((r: OpenRole, i: number) => {
                  const descLen = r.description?.trim().length || 0;
                  const isTitleValid = (r.title?.trim().length || 0) >= 3;
                  const hasSkills = Boolean(r.skills?.trim());
                  const isDescValid = descLen >= 10;
                  const isComplete = isTitleValid && hasSkills && isDescValid;

                  return (
                    <div
                      className="p-6 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px] shadow-xs"
                      key={i}
                    >
                      <div className="flex items-center justify-between pb-3 mb-5 border-b border-[var(--hairline)]">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink)]">
                            Role #{i + 1}
                          </span>
                          <span className="font-display font-medium text-[var(--ink)] text-base">
                            {r.title?.trim() || "Untitled Open Role"}
                          </span>
                        </div>
                        {isComplete ? (
                          <span className="font-mono text-[10px] text-[var(--deep)] bg-[#E4ECE7] px-2.5 py-0.5 rounded-[2px] flex items-center gap-1 font-medium">
                            <Check size={11} /> Ready
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-[var(--accent)] bg-[#FDF1EE] px-2.5 py-0.5 rounded-[2px] font-medium">
                            Incomplete
                          </span>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                            Role title{" "}
                            <span className="text-[10px] font-normal normal-case text-[var(--muted)]">
                              (min 3 chars)
                            </span>
                          </label>
                          <input
                            type="text"
                            className="field mt-1.5"
                            value={r.title || ""}
                            onChange={(e) => updateRole(i, "title", e.target.value)}
                            placeholder="e.g. React & TypeScript Developer"
                          />
                        </div>

                        <Select
                          label="Engagement model"
                          value={r.engagement}
                          onChange={(v) => updateRole(i, "engagement", v)}
                          options={["EQUITY", "STIPEND", "VOLUNTEER"]}
                        />

                        <div>
                          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                            Required skills{" "}
                            <span className="text-[10px] font-normal normal-case text-[var(--muted)]">
                              (comma-separated)
                            </span>
                          </label>
                          <input
                            type="text"
                            className="field mt-1.5"
                            value={r.skills || ""}
                            onChange={(e) => updateRole(i, "skills", e.target.value)}
                            placeholder="e.g. React, Java, TypeScript"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                            Description{" "}
                            <span
                              className={`text-[10px] font-normal normal-case ml-1 ${
                                isDescValid
                                  ? "text-[var(--deep)] font-medium"
                                  : "text-[var(--accent)] font-medium"
                              }`}
                            >
                              ({descLen}/10 min chars
                              {descLen < 10
                                ? ` · ${10 - descLen} more needed`
                                : " ✓"}
                              )
                            </span>
                          </label>
                          <input
                            type="text"
                            className="field mt-1.5"
                            value={r.description || ""}
                            onChange={(e) => updateRole(i, "description", e.target.value)}
                            placeholder="Briefly describe what this builder will work on (min 10 chars)"
                          />
                        </div>

                        <Field
                          label="Equity range (optional)"
                          value={r.equity_range}
                          onChange={(v) => updateRole(i, "equity_range", v)}
                          placeholder="e.g. 0.5% - 1.5% or Negotiable"
                        />

                        <Field
                          label="Stipend range (optional)"
                          value={r.stipend_range}
                          onChange={(v) => updateRole(i, "stipend_range", v)}
                          placeholder="e.g. $500 - $1,500 / month"
                        />

                        <Field
                          label="Hours / week"
                          type="number"
                          value={r.hours}
                          onChange={(v) => updateRole(i, "hours", Number(v))}
                          placeholder="10"
                        />

                        <Field
                          label="Duration (weeks)"
                          type="number"
                          value={r.duration}
                          onChange={(v) => updateRole(i, "duration", Number(v))}
                          placeholder="12"
                        />
                      </div>

                      {data.roles.length > 1 && (
                        <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "roles",
                                data.roles.filter((_: any, n: number) => n !== i),
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs text-[#9C3826] hover:text-[#7A2C1D] font-mono font-medium transition"
                          >
                            <Trash2 size={13} /> Remove this role
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => set("roles", [...data.roles, emptyRole()])}
                  className="btn bg-[var(--base)] border-[var(--hairline)] hover:border-[var(--ink)] text-xs font-mono font-medium gap-2 rounded-[2px]"
                >
                  <Plus size={14} /> Add another open role
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
                Portfolio & verifiable work
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                Provide links to your GitHub repositories, deployed projects, or resume.
              </p>

              <Area
                label="Portfolio URLs (one per line, https:// required)"
                value={data.portfolio_urls}
                onChange={(v) => set("portfolio_urls", v)}
                rows={5}
                placeholder="https://github.com/your-username&#10;https://my-project.com"
              />

              <Field
                label="Resume URL (optional, https:// required)"
                value={data.resume_url}
                onChange={(v) => set("resume_url", v)}
                placeholder="https://drive.google.com/..."
              />
            </>
          ))}

        {/* STEP 5: PREVIEW */}
        {step === 5 && (
          <>
            <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
              Preview and initial matches
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
              Review your structured brief before publishing. Here are candidates or projects currently matching your profile.
            </p>

            <div className="p-6 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px] mt-6">
              <div className="flex items-center justify-between">
                <b className="font-display text-xl font-medium text-[var(--ink)]">
                  {role === "FOUNDER" ? data.startup_name : data.name}
                </b>
                <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]">
                  {role === "FOUNDER" ? data.stage : data.education_year}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                {role === "FOUNDER"
                  ? `${data.domain} · ${data.tagline || "Open Brief"}`
                  : `${data.college} · ${data.preferred_role}`}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[var(--hairline)]">
                {(role === "FOUNDER"
                  ? data.roles.flatMap((r: OpenRole) => r.skills.split(","))
                  : data.skills.map(
                      (s: Skill) => `${s.name} · ${s.proficiency}`,
                    )
                )
                  .map((x: string) => x.trim())
                  .filter(Boolean)
                  .slice(0, 10)
                  .map((x: string) => (
                    <span
                      key={x}
                      className="font-mono text-[10px] text-[var(--muted)] border border-[var(--hairline)] px-2 py-0.5 rounded-[2px] bg-[var(--surface)]"
                    >
                      {x}
                    </span>
                  ))}
              </div>
            </div>

            <p className="font-mono-eyebrow text-[10px] text-[var(--muted)] mt-8">
              INITIAL COHORT MATCHES
            </p>

            <div className="grid sm:grid-cols-3 gap-3.5 mt-3">
              {matches.length ? (
                matches.map((m) => (
                  <div
                    className="p-5 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]"
                    key={m.id}
                  >
                    <b className="font-display font-medium text-base text-[var(--ink)] block">
                      {m.title || m.name}
                    </b>
                    <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                      {m.matchReason}
                    </p>
                    <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-[var(--deep)] bg-[#E4ECE7] px-2 py-0.5 rounded-[2px] font-medium flex items-center gap-1">
                        <Sparkles size={11} /> {m.matchScore}% MATCH
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-6 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px] text-center text-sm text-[var(--muted)]">
                  Your profile and project brief are ready to publish. Initial matches will populate immediately as candidates and founders browse active briefs.
                </div>
              )}
            </div>
          </>
        )}

        {/* Bottom Error Banner */}
        {error && (
          <div
            role="alert"
            className="my-5 p-4 bg-[#FDF1EE] border border-[#F2C5BC] rounded-[2px] text-xs text-[#9C3826] font-mono leading-relaxed flex items-start gap-2.5 shadow-xs"
          >
            <span className="font-bold text-sm">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--hairline)]">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={() => {
              setError("");
              setStep((s) => Math.max(1, s - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="btn bg-[var(--base)] border-[var(--hairline)] hover:border-[var(--ink)] text-sm rounded-[2px] disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={loading}
              onClick={next}
              className="btn-editorial text-sm rounded-[2px] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Verifying…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Continue <ArrowRight size={15} />
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={finish}
              className="btn-editorial text-sm rounded-[2px] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Finalizing…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Complete onboarding
                </span>
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
      {label}
      <input
        type={type}
        className="field mt-1.5"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)] mt-5">
      {label}
      <textarea
        rows={rows}
        className="field mt-1.5"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
      {label}
      <select
        className="field mt-1.5"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select option</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </label>
  );
}

function Timezone({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      label="Timezone"
      value={value}
      onChange={onChange}
      options={[
        "UTC-8 Pacific",
        "UTC-5 Eastern",
        "UTC+0 London",
        "UTC+1 Europe",
        "UTC+5:30 India",
        "UTC+8 Singapore",
        "UTC+10 Sydney",
        "Other",
      ]}
    />
  );
}
