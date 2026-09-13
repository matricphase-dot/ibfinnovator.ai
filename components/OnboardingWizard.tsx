"use client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
export default function OnboardingWizard({
  initialRole,
}: {
  initialRole?: Role;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1),
    [role, setRole] = useState<Role>(initialRole || "STUDENT"),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [matches, setMatches] = useState<any[]>([]),
    [data, setData] = useState<any>({
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
    if (saved)
      try {
        const x = JSON.parse(saved);
        setData((d: any) => ({ ...d, ...x.data }));
        setRole(x.role || initialRole || "STUDENT");
        setStep(Math.max(1, Math.min(5, x.step || 1)));
      } catch {}
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
  function validate() {
    setError("");
    if (step === 1) {
      if (data.name.trim().length < 2) return "Enter your full name.";
      if (!/^[a-z0-9_]{3,30}$/.test(data.username))
        return "Username must use 3–30 lowercase letters, numbers, or underscores.";
    }
    if (role === "FOUNDER") {
      if (step === 2 && (!data.availability || !data.timezone))
        return "Availability and timezone are required.";
      if (step === 3) {
        if (!data.startup_name || !data.domain || !data.stage)
          return "Complete the startup details.";
        if (wordCount(data.problem) < 100 || wordCount(data.solution) < 100)
          return "Problem and solution must each contain at least 100 words.";
      }
      if (
        step === 4 &&
        (!data.roles.length ||
          data.roles.some(
            (r: OpenRole) =>
              r.title.length < 3 ||
              r.description.length < 10 ||
              !r.skills.trim(),
          ))
      )
        return "Add at least one complete open role.";
    } else {
      if (step === 2 && (!data.college || !data.education_year))
        return "College and education year are required.";
      if (step === 3) {
        if (
          !data.skills.length ||
          data.skills.some((s: Skill) => !s.name.trim())
        )
          return "Add at least one skill.";
        if (
          !data.interests.trim() ||
          !data.preferred_role ||
          !data.availability ||
          !data.timezone
        )
          return "Complete interests, role, availability, and timezone.";
        if (wordCount(data.goals) < 50)
          return "Collaboration goals must contain at least 50 words.";
      }
    }
    return "";
  }
  async function next() {
    const e = validate();
    if (e) return setError(e);
    if (step === 4) {
      setLoading(true);
      try {
        const r = await fetch("/api/onboarding", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "preview", role, data: payload() }),
          }),
          x = await r.json();
        if (!r.ok) throw new Error(x.error);
        setMatches(x.matches || []);
        setStep(5);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    } else setStep((s) => Math.min(5, s + 1));
  }
  function payload() {
    return role === "FOUNDER"
      ? {
          ...data,
          roles: data.roles.map((r: OpenRole) => ({
            ...r,
            skills: r.skills
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
          })),
        }
      : {
          ...data,
          interests: data.interests
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean),
          portfolio_urls: data.portfolio_urls
            .split("\n")
            .map((x: string) => x.trim())
            .filter(Boolean),
        };
  }
  async function finish() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "finalize", role, data: payload() }),
        }),
        x = await r.json();
      if (!r.ok) throw new Error(x.error);
      localStorage.removeItem(KEY);
      toast.success("Onboarding complete");
      window.location.assign(x.redirect || "/dashboard");
    } catch (e: any) {
      setError(e.message);
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
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div className="flex items-center flex-1" key={i}>
            <span
              className={`w-9 h-9 shrink-0 rounded-full grid place-items-center text-sm font-bold ${i <= step ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-500"}`}
            >
              {i < step ? <Check size={15} /> : i}
            </span>
            {i < 5 && (
              <i
                className={`h-1 flex-1 ${i < step ? "bg-cyan-300" : "bg-white/10"}`}
              />
            )}
          </div>
        ))}
      </div>
      <section className="glass-dark rounded-2xl p-6 md:p-9">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          {role} ONBOARDING · STEP {step} OF 5
        </p>
        {step === 1 && (
          <>
            <h1 className="text-3xl font-black mt-2">Your IBF identity</h1>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setRole("FOUNDER")}
                className={`p-5 rounded-xl border text-left ${role === "FOUNDER" ? "border-cyan-300 bg-cyan-300/[.07]" : "border-white/10"}`}
              >
                <b>Founder</b>
                <p className="text-xs text-slate-500 mt-2">
                  Build a startup and recruit collaborators.
                </p>
              </button>
              <button
                onClick={() => setRole("STUDENT")}
                className={`p-5 rounded-xl border text-left ${role === "STUDENT" ? "border-cyan-300 bg-cyan-300/[.07]" : "border-white/10"}`}
              >
                <b>Student / Professional</b>
                <p className="text-xs text-slate-500 mt-2">
                  Join projects and build verified experience.
                </p>
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <Field
                label="Full name"
                value={data.name}
                onChange={(v) => set("name", v)}
              />
              <Field
                label="Username"
                value={data.username}
                onChange={(v) =>
                  set("username", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="your_username"
              />
            </div>
          </>
        )}
        {step === 2 &&
          (role === "FOUNDER" ? (
            <>
              <h1 className="text-3xl font-black mt-2">Founder background</h1>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="Company"
                  value={data.company}
                  onChange={(v) => set("company", v)}
                />
                <Field
                  label="Industry experience"
                  value={data.industry}
                  onChange={(v) => set("industry", v)}
                />
                <Field
                  label="LinkedIn URL"
                  value={data.linkedin_url}
                  onChange={(v) => set("linkedin_url", v)}
                />
                <Field
                  label="GitHub URL"
                  value={data.github_url}
                  onChange={(v) => set("github_url", v)}
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
                label="Past ventures"
                value={data.past_ventures}
                onChange={(v) => set("past_ventures", v)}
              />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mt-2">
                Education and social links
              </h1>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="College / university"
                  value={data.college}
                  onChange={(v) => set("college", v)}
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
                />
                <Field
                  label="GitHub URL"
                  value={data.github_url}
                  onChange={(v) => set("github_url", v)}
                />
              </div>
            </>
          ))}
        {step === 3 &&
          (role === "FOUNDER" ? (
            <>
              <h1 className="text-3xl font-black mt-2">Startup details</h1>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field
                  label="Startup name"
                  value={data.startup_name}
                  onChange={(v) => set("startup_name", v)}
                />
                <Field
                  label="Tagline"
                  value={data.tagline}
                  onChange={(v) => set("tagline", v)}
                />
                <Select
                  label="Domain"
                  value={data.domain}
                  onChange={(v) => set("domain", v)}
                  options={[
                    "FinTech",
                    "EdTech",
                    "HealthTech",
                    "AI/ML",
                    "SaaS",
                    "Climate Tech",
                    "E-commerce",
                    "Other",
                  ]}
                />
                <Select
                  label="Stage"
                  value={data.stage}
                  onChange={(v) => set("stage", v)}
                  options={["IDEA", "MVP", "BETA", "REVENUE", "FUNDED"]}
                />
              </div>
              <Area
                label={`Problem statement (${wordCount(data.problem)}/100 words)`}
                value={data.problem}
                onChange={(v) => set("problem", v)}
                rows={7}
              />
              <Area
                label={`Solution overview (${wordCount(data.solution)}/100 words)`}
                value={data.solution}
                onChange={(v) => set("solution", v)}
                rows={7}
              />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mt-2">
                Skills, interests and goals
              </h1>
              <div className="space-y-3 mt-6">
                {data.skills.map((s: Skill, i: number) => (
                  <div
                    className="grid grid-cols-[1fr_170px_40px] gap-2"
                    key={i}
                  >
                    <input
                      className="field"
                      value={s.name}
                      onChange={(e) => updateSkill(i, "name", e.target.value)}
                      placeholder="Skill"
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
                    <button
                      onClick={() =>
                        set(
                          "skills",
                          data.skills.filter((_: any, n: number) => n !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    set("skills", [
                      ...data.skills,
                      { name: "", proficiency: "Beginner" },
                    ])
                  }
                  className="btn btn-secondary"
                >
                  <Plus size={15} />
                  Add skill
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <Field
                  label="Interests (comma separated)"
                  value={data.interests}
                  onChange={(v) => set("interests", v)}
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
                label={`Collaboration goals (${wordCount(data.goals)}/50 words)`}
                value={data.goals}
                onChange={(v) => set("goals", v)}
                rows={6}
              />
            </>
          ))}
        {step === 4 &&
          (role === "FOUNDER" ? (
            <>
              <h1 className="text-3xl font-black mt-2">
                Open roles and engagement
              </h1>
              <div className="space-y-4 mt-6">
                {data.roles.map((r: OpenRole, i: number) => (
                  <div
                    className="p-4 border border-white/10 rounded-xl"
                    key={i}
                  >
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field
                        label="Role title"
                        value={r.title}
                        onChange={(v) => updateRole(i, "title", v)}
                      />
                      <Select
                        label="Engagement"
                        value={r.engagement}
                        onChange={(v) => updateRole(i, "engagement", v)}
                        options={["EQUITY", "STIPEND", "VOLUNTEER"]}
                      />
                      <Field
                        label="Required skills"
                        value={r.skills}
                        onChange={(v) => updateRole(i, "skills", v)}
                        placeholder="React, Figma, Sales"
                      />
                      <Field
                        label="Description"
                        value={r.description}
                        onChange={(v) => updateRole(i, "description", v)}
                      />
                      <Field
                        label="Equity range"
                        value={r.equity_range}
                        onChange={(v) => updateRole(i, "equity_range", v)}
                      />
                      <Field
                        label="Stipend range"
                        value={r.stipend_range}
                        onChange={(v) => updateRole(i, "stipend_range", v)}
                      />
                      <Field
                        label="Hours / week"
                        type="number"
                        value={r.hours}
                        onChange={(v) => updateRole(i, "hours", Number(v))}
                      />
                      <Field
                        label="Duration (weeks)"
                        type="number"
                        value={r.duration}
                        onChange={(v) => updateRole(i, "duration", Number(v))}
                      />
                    </div>
                    <button
                      onClick={() =>
                        set(
                          "roles",
                          data.roles.filter((_: any, n: number) => n !== i),
                        )
                      }
                      className="text-red-300 text-xs mt-3"
                    >
                      Remove role
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set("roles", [...data.roles, emptyRole()])}
                  className="btn btn-secondary"
                >
                  <Plus size={15} />
                  Add role
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black mt-2">Portfolio and work</h1>
              <Area
                label="Portfolio URLs (one per line)"
                value={data.portfolio_urls}
                onChange={(v) => set("portfolio_urls", v)}
                rows={6}
              />
              <Field
                label="Resume URL"
                value={data.resume_url}
                onChange={(v) => set("resume_url", v)}
              />
            </>
          ))}
        {step === 5 && (
          <>
            <h1 className="text-3xl font-black mt-2">
              Preview and initial matches
            </h1>
            <div className="p-5 border border-white/10 rounded-xl mt-6">
              <b className="text-xl">
                {role === "FOUNDER" ? data.startup_name : data.name}
              </b>
              <p className="text-sm text-slate-500 mt-2">
                {role === "FOUNDER"
                  ? `${data.domain} · ${data.stage}`
                  : `${data.college} · ${data.preferred_role}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(role === "FOUNDER"
                  ? data.roles.flatMap((r: OpenRole) => r.skills.split(","))
                  : data.skills.map(
                      (s: Skill) => `${s.name} · ${s.proficiency}`,
                    )
                )
                  .slice(0, 8)
                  .map((x: string) => (
                    <span className="tech-chip" key={x}>
                      {x}
                    </span>
                  ))}
              </div>
            </div>
            <p className="text-xs tracking-widest text-cyan-300 font-bold mt-6">
              TOP PREVIEW MATCHES
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {matches.length ? (
                matches.map((m) => (
                  <div
                    className="p-4 border border-white/10 rounded-xl"
                    key={m.id}
                  >
                    <b>{m.title || m.name}</b>
                    <p className="text-xs text-slate-500 mt-2">
                      {m.matchReason}
                    </p>
                    <span className="match-chip mt-3">
                      <Sparkles size={11} />
                      {m.matchScore}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 col-span-3">
                  No live matches yet. Your profile will be ready as soon as
                  projects or talent join.
                </p>
              )}
            </div>
          </>
        )}
        {error && (
          <p className="mt-5 p-3 border border-red-400/20 bg-red-400/[.06] text-red-300 rounded-xl text-sm">
            {error}
          </p>
        )}
        <div className="flex mt-8">
          <button
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step < 5 ? (
            <button
              disabled={loading}
              onClick={next}
              className="btn btn-primary ml-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Continue <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={finish}
              className="btn btn-primary ml-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Complete onboarding"
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
    <label className="block text-sm font-bold">
      {label}
      <input
        type={type}
        className="field mt-2"
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-bold mt-5">
      {label}
      <textarea
        rows={rows}
        className="field mt-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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
    <label className="block text-sm font-bold">
      {label}
      <select
        className="field mt-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {options.map((x) => (
          <option key={x}>{x}</option>
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
