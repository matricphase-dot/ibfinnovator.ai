"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

type Role = "FOUNDER" | "STUDENT";

const DRAFT_KEY = "ibf_onboarding_draft";

const DOMAINS = ["FinTech", "EdTech", "HealthTech", "AI-ML", "SaaS", "Climate", "Other"];
const STAGES = ["Idea", "MVP", "Beta", "Revenue", "Funded"];
const YEARS = ["1st", "2nd", "3rd", "4th", "Graduate", "Other"];
const ENGAGEMENTS = ["EQUITY", "STIPEND", "VOLUNTEER"];
const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const AVAILABILITY = ["5-10 hrs/week", "10-20 hrs/week", "20-30 hrs/week", "30+ hrs/week"];

const wordCount = (value: string) =>
  (value || "").trim().split(/\s+/).filter(Boolean).length;

const emptyRole = () => ({
  title: "",
  description: "",
  skills: "",
  engagement: "EQUITY",
  hours: "10",
  duration: "8",
});

const emptySkill = () => ({ name: "", proficiency: "Intermediate" });

type MatchRow = {
  id: string;
  title: string;
  subtitle?: string;
  matchScore: number;
  matchReason: string;
};

export default function OnboardingWizard({
  mode = "resume",
  role = "STUDENT",
  initialName = "",
}: {
  mode?: "signup" | "resume";
  role?: Role;
  initialName?: string;
}) {
  const router = useRouter();
  const founder = role === "FOUNDER";

  const [hydrated, setHydrated] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [notice, setNotice] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [data, setData] = useState<any>({
    name: initialName,
    username: "",
    company: "",
    linkedin_url: "",
    github_url: "",
    availability: AVAILABILITY[1],
    timezone: "",
    past_ventures: "",
    industry: "",
    startup_name: "",
    tagline: "",
    domain: "SaaS",
    stage: "Idea",
    problem: "",
    solution: "",
    roles: [emptyRole()],
    college: "",
    education_year: "1st",
    proficiency: [emptySkill()],
    interests: "",
    preferred_role: "",
    goals: "",
    portfolio_urls: "",
    resume_url: "",
  });

  const set = useCallback(
    (patch: any) => setData((current: any) => ({ ...current, ...patch })),
    [],
  );

  /* ---------------- draft persistence ---------------- */

  useEffect(() => {
    let draft: any = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role === role && parsed.data) draft = parsed;
      }
    } catch {
      draft = null;
    }

    if (draft) {
      setPendingDraft(draft);
    } else {
      // A fresh start still gets a sensible timezone default.
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) set({ timezone: tz });
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, [role, set]);

  useEffect(() => {
    if (!hydrated || pendingDraft) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ role, step, data, savedAt: Date.now() }),
      );
    } catch {
      /* storage full or unavailable — the wizard still works */
    }
  }, [hydrated, pendingDraft, role, step, data]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const resumeDraft = () => {
    if (!pendingDraft) return;
    setData((current: any) => ({ ...current, ...pendingDraft.data }));
    setStep(
      mode === "resume" && pendingDraft.data?.username
        ? Math.min(Math.max(pendingDraft.step || 2, 2), 5)
        : Math.min(Math.max(pendingDraft.step || 1, 1), 5),
    );
    setPendingDraft(null);
  };

  const startOver = () => {
    clearDraft();
    setPendingDraft(null);
    setStep(1);
  };

  /* ---------------- step validation ---------------- */

  const validateStep = (which: number): string | null => {
    if (which === 1) {
      if (!String(data.name || "").trim()) return "Please enter your display name.";
      if (!/^[a-z0-9_]{3,30}$/.test(String(data.username || "").trim().toLowerCase()))
        return "Username must be 3-30 characters using lowercase letters, numbers or underscore.";
    }

    if (founder) {
      if (which === 3) {
        if (!String(data.startup_name || "").trim()) return "Your startup needs a name.";
        if (wordCount(data.problem) < 100)
          return `The problem statement must be at least 100 words — currently ${wordCount(data.problem)}.`;
        if (wordCount(data.solution) < 100)
          return `The solution overview must be at least 100 words — currently ${wordCount(data.solution)}.`;
      }
      if (which === 4) {
        const roles = data.roles || [];
        if (!roles.length) return "Add at least one open role.";
        for (let i = 0; i < roles.length; i++) {
          const r = roles[i];
          if (!String(r.title || "").trim())
            return `Role ${i + 1} needs a title.`;
          if (String(r.description || "").trim().length < 10)
            return `Role ${i + 1} needs a description of at least 10 characters.`;
          if (!(parseInt(r.hours, 10) >= 1)) return `Role ${i + 1} needs hours of 1 or more.`;
          if (!(parseInt(r.duration, 10) >= 1))
            return `Role ${i + 1} needs a duration of at least 1 week.`;
        }
      }
    } else {
      if (which === 2) {
        if (String(data.college || "").trim().length < 2)
          return "Please enter your college or university.";
      }
      if (which === 3) {
        const skills = (data.proficiency || []).filter((s: any) => String(s.name || "").trim());
        if (!skills.length) return "Add at least one skill.";
        if (wordCount(data.goals) < 50)
          return `Your goals must be at least 50 words — currently ${wordCount(data.goals)}.`;
      }
    }
    return null;
  };

  const next = () => {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, 5));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  /* ---------------- preview ---------------- */

  const payload = useMemo(() => {
    // Convert the form's comma/newline strings into the shape the API expects.
    const base: any = {
      name: data.name,
      username: String(data.username || "").trim().toLowerCase(),
      linkedin_url: data.linkedin_url,
      github_url: data.github_url,
      availability: data.availability,
      timezone: data.timezone,
      interests: data.interests,
    };
    if (founder) {
      return {
        ...base,
        company: data.company,
        past_ventures: data.past_ventures,
        industry: data.industry,
        startup_name: data.startup_name,
        tagline: data.tagline,
        domain: data.domain,
        stage: data.stage,
        problem: data.problem,
        solution: data.solution,
        roles: (data.roles || []).map((r: any) => ({
          title: r.title,
          description: r.description,
          skills: String(r.skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          engagement: r.engagement,
          hours: parseInt(r.hours, 10) || 0,
          duration: parseInt(r.duration, 10) || 0,
        })),
      };
    }
    return {
      ...base,
      college: data.college,
      education_year: data.education_year,
      proficiency: (data.proficiency || [])
        .filter((s: any) => String(s.name || "").trim())
        .map((s: any) => ({ name: s.name.trim(), proficiency: s.proficiency })),
      preferred_role: data.preferred_role,
      goals: data.goals,
      portfolio_urls: data.portfolio_urls,
      resume_url: data.resume_url,
    };
  }, [data, founder]);

  const loadPreview = useCallback(async () => {
    setLoadingMatches(true);
    setNotice("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "preview", role, data: payload }),
      });
      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }
      const body = await response.json();
      if (!response.ok) {
        setMatches([]);
        setNotice(body.error || "Could not load matches right now.");
        return;
      }
      setMatches(body.matches || []);
      if (body.notice) setNotice(body.notice);
    } catch {
      setMatches([]);
      setNotice("Could not load matches right now.");
    } finally {
      setLoadingMatches(false);
    }
  }, [payload, role, router]);

  useEffect(() => {
    if (!hydrated || pendingDraft) return;
    if (step === 5 && matches === null && !loadingMatches) loadPreview();
  }, [hydrated, pendingDraft, step, matches, loadingMatches, loadPreview]);

  /* ---------------- finalize ---------------- */

  const complete = async () => {
    for (const which of [1, 2, 3, 4]) {
      const problem = validateStep(which);
      if (problem) {
        setError(problem);
        setStep(which);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finalize", role, data: payload }),
      });
      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Could not save your onboarding.");
        setBusy(false);
        return;
      }
      clearDraft();
      router.push(body.redirect || "/dashboard");
    } catch {
      setError("Could not save your onboarding. Please try again.");
      setBusy(false);
    }
  };

  /* ---------------- presentation ---------------- */

  const stepLabels = founder
    ? ["Identity", "Background", "Startup", "Open roles", "Preview"]
    : ["Identity", "Education", "Skills", "Portfolio", "Preview"];

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] grid place-items-center">
        <Loader2 className="animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <header className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center">
            {founder ? <Rocket size={18} /> : <GraduationCap size={18} />}
          </span>
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              {founder ? "FOUNDER ONBOARDING" : "STUDENT ONBOARDING"}
            </p>
            <h1 className="text-2xl font-black">Let&rsquo;s build your profile</h1>
          </div>
        </header>

        {/* progress */}
        <ol className="flex flex-wrap gap-2 mt-8">
          {stepLabels.map((label, index) => {
            const which = index + 1;
            const done = which < step;
            const active = which === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border ${
                  active
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                    : done
                      ? "border-cyan-300/20 bg-cyan-300/5 text-cyan-300/70"
                      : "border-white/10 text-slate-500"
                }`}
              >
                <span className="grid place-items-center w-4 h-4">
                  {done ? <Check size={13} /> : which}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        {error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.03] p-6 md:p-8">
          {/* ---------------- step 1: identity ---------------- */}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Display name" hint="Shown to founders and students">
                <input
                  className="field"
                  value={data.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Ada Lovelace"
                />
              </Field>
              <Field
                label="Username"
                hint="3-30 characters: lowercase letters, numbers, underscore. Your public handle."
              >
                <input
                  className="field"
                  value={data.username}
                  onChange={(e) =>
                    set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
                  }
                  placeholder="ada_l"
                />
              </Field>
            </div>
          )}

          {/* ---------------- founder step 2 ---------------- */}
          {founder && step === 2 && (
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Company" hint="Optional">
                <input
                  className="field"
                  value={data.company}
                  onChange={(e) => set({ company: e.target.value })}
                  placeholder="Analytical Engines"
                />
              </Field>
              <Field label="Industry" hint="Optional">
                <input
                  className="field"
                  value={data.industry}
                  onChange={(e) => set({ industry: e.target.value })}
                  placeholder="FinTech"
                />
              </Field>
              <Field label="LinkedIn" hint="Optional">
                <input
                  className="field"
                  value={data.linkedin_url}
                  onChange={(e) => set({ linkedin_url: e.target.value })}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <Field label="GitHub" hint="Optional">
                <input
                  className="field"
                  value={data.github_url}
                  onChange={(e) => set({ github_url: e.target.value })}
                  placeholder="github.com/you"
                />
              </Field>
              <Field label="Availability">
                <select
                  className="field"
                  value={data.availability}
                  onChange={(e) => set({ availability: e.target.value })}
                >
                  {AVAILABILITY.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone">
                <input
                  className="field"
                  value={data.timezone}
                  onChange={(e) => set({ timezone: e.target.value })}
                  placeholder="Asia/Kolkata"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Past ventures" hint="Optional — what have you built before?">
                  <textarea
                    className="field min-h-[90px]"
                    value={data.past_ventures}
                    onChange={(e) => set({ past_ventures: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ---------------- founder step 3 ---------------- */}
          {founder && step === 3 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Startup name">
                  <input
                    className="field"
                    value={data.startup_name}
                    onChange={(e) => set({ startup_name: e.target.value })}
                    placeholder="Difference Engine"
                  />
                </Field>
                <Field label="Tagline" hint="Optional">
                  <input
                    className="field"
                    value={data.tagline}
                    onChange={(e) => set({ tagline: e.target.value })}
                    placeholder="Compute, beautifully"
                  />
                </Field>
                <Field label="Domain">
                  <select
                    className="field"
                    value={data.domain}
                    onChange={(e) => set({ domain: e.target.value })}
                  >
                    {DOMAINS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Stage">
                  <select
                    className="field"
                    value={data.stage}
                    onChange={(e) => set({ stage: e.target.value })}
                  >
                    {STAGES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Prose
                label="The problem"
                hint="At least 100 words"
                value={data.problem}
                onChange={(v) => set({ problem: v })}
                min={100}
              />
              <Prose
                label="Your solution"
                hint="At least 100 words"
                value={data.solution}
                onChange={(v) => set({ solution: v })}
                min={100}
              />
            </div>
          )}

          {/* ---------------- founder step 4 ---------------- */}
          {founder && step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                Tell us who you need. Each role becomes a listing students can match against.
              </p>
              {(data.roles || []).map((r: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#09111f] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <b className="text-sm text-cyan-200">Role {index + 1}</b>
                    {data.roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set({ roles: data.roles.filter((_: any, i: number) => i !== index) })
                        }
                        className="text-slate-500 hover:text-red-300"
                        aria-label={`Remove role ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Title">
                      <input
                        className="field"
                        value={r.title}
                        onChange={(e) => {
                          const roles = [...data.roles];
                          roles[index] = { ...r, title: e.target.value };
                          set({ roles });
                        }}
                        placeholder="Backend Engineer"
                      />
                    </Field>
                    <Field label="Skills" hint="Comma separated">
                      <input
                        className="field"
                        value={r.skills}
                        onChange={(e) => {
                          const roles = [...data.roles];
                          roles[index] = { ...r, skills: e.target.value };
                          set({ roles });
                        }}
                        placeholder="Python, Postgres"
                      />
                    </Field>
                    <Field label="Engagement">
                      <select
                        className="field"
                        value={r.engagement}
                        onChange={(e) => {
                          const roles = [...data.roles];
                          roles[index] = { ...r, engagement: e.target.value };
                          set({ roles });
                        }}
                      >
                        {ENGAGEMENTS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Hours / week">
                        <input
                          className="field"
                          type="number"
                          min={1}
                          value={r.hours}
                          onChange={(e) => {
                            const roles = [...data.roles];
                            roles[index] = { ...r, hours: e.target.value };
                            set({ roles });
                          }}
                        />
                      </Field>
                      <Field label="Weeks">
                        <input
                          className="field"
                          type="number"
                          min={1}
                          value={r.duration}
                          onChange={(e) => {
                            const roles = [...data.roles];
                            roles[index] = { ...r, duration: e.target.value };
                            set({ roles });
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                  <Prose
                    label="Role description"
                    hint="At least 10 characters"
                    value={r.description}
                    onChange={(v) => {
                      const roles = [...data.roles];
                      roles[index] = { ...r, description: v };
                      set({ roles });
                    }}
                    min={0}
                    minChars={10}
                    rows={3}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ roles: [...(data.roles || []), emptyRole()] })}
                className="btn btn-secondary w-full"
              >
                <Plus size={16} /> Add another role
              </button>
            </div>
          )}

          {/* ---------------- student step 2 ---------------- */}
          {!founder && step === 2 && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="College / university">
                  <input
                    className="field"
                    value={data.college}
                    onChange={(e) => set({ college: e.target.value })}
                    placeholder="MIT"
                  />
                </Field>
              </div>
              <Field label="Year">
                <select
                  className="field"
                  value={data.education_year}
                  onChange={(e) => set({ education_year: e.target.value })}
                >
                  {YEARS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="LinkedIn" hint="Optional">
                <input
                  className="field"
                  value={data.linkedin_url}
                  onChange={(e) => set({ linkedin_url: e.target.value })}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="GitHub" hint="Optional">
                  <input
                    className="field"
                    value={data.github_url}
                    onChange={(e) => set({ github_url: e.target.value })}
                    placeholder="github.com/you"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ---------------- student step 3 ---------------- */}
          {!founder && step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold">Skills</p>
                {(data.proficiency || []).map((s: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <input
                      className="field"
                      value={s.name}
                      onChange={(e) => {
                        const list = [...data.proficiency];
                        list[index] = { ...s, name: e.target.value };
                        set({ proficiency: list });
                      }}
                      placeholder="Python"
                    />
                    <select
                      className="field w-40"
                      value={s.proficiency}
                      onChange={(e) => {
                        const list = [...data.proficiency];
                        list[index] = { ...s, proficiency: e.target.value };
                        set({ proficiency: list });
                      }}
                    >
                      {PROFICIENCIES.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    {data.proficiency.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set({
                            proficiency: data.proficiency.filter(
                              (_: any, i: number) => i !== index,
                            ),
                          })
                        }
                        className="text-slate-500 hover:text-red-300"
                        aria-label={`Remove skill ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set({ proficiency: [...data.proficiency, emptySkill()] })}
                  className="btn btn-secondary w-full"
                >
                  <Plus size={16} /> Add skill
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Interests" hint="Comma separated">
                  <input
                    className="field"
                    value={data.interests}
                    onChange={(e) => set({ interests: e.target.value })}
                    placeholder="AI-ML, FinTech"
                  />
                </Field>
                <Field label="Preferred role" hint="Optional">
                  <input
                    className="field"
                    value={data.preferred_role}
                    onChange={(e) => set({ preferred_role: e.target.value })}
                    placeholder="Backend Engineer"
                  />
                </Field>
                <Field label="Availability">
                  <select
                    className="field"
                    value={data.availability}
                    onChange={(e) => set({ availability: e.target.value })}
                  >
                    {AVAILABILITY.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Timezone">
                  <input
                    className="field"
                    value={data.timezone}
                    onChange={(e) => set({ timezone: e.target.value })}
                    placeholder="Asia/Kolkata"
                  />
                </Field>
              </div>

              <Prose
                label="Your goals"
                hint="At least 50 words"
                value={data.goals}
                onChange={(v) => set({ goals: v })}
                min={50}
              />
            </div>
          )}

          {/* ---------------- student step 4 ---------------- */}
          {!founder && step === 4 && (
            <div className="space-y-5">
              <Prose
                label="Portfolio links"
                hint="One per line — optional"
                value={data.portfolio_urls}
                onChange={(v) => set({ portfolio_urls: v })}
                min={0}
                rows={4}
              />
              <Field label="Résumé link" hint="Optional">
                <input
                  className="field"
                  value={data.resume_url}
                  onChange={(e) => set({ resume_url: e.target.value })}
                  placeholder="https://…/resume.pdf"
                />
              </Field>
            </div>
          )}

          {/* ---------------- step 5: preview ---------------- */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black tracking-widest text-cyan-300">
                  ALMOST THERE
                </p>
                <h2 className="text-xl font-black mt-1">
                  {founder ? "Your startup summary" : "Your profile summary"}
                </h2>
              </div>

              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                {(founder
                  ? [
                      ["Name", data.name],
                      ["Username", `@${data.username}`],
                      ["Startup", data.startup_name],
                      ["Domain", `${data.domain} · ${data.stage}`],
                      ["Open roles", `${(data.roles || []).length}`],
                    ]
                  : [
                      ["Name", data.name],
                      ["Username", `@${data.username}`],
                      ["College", `${data.college} · ${data.education_year}`],
                      ["Skills", (data.proficiency || [])
                        .map((s: any) => s.name)
                        .filter(Boolean)
                        .join(", ")],
                      ["Availability", data.availability],
                    ]
                ).map(([label, value]: any) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-[#09111f] p-4">
                    <dt className="text-[10px] tracking-widest text-slate-500 font-bold">
                      {String(label).toUpperCase()}
                    </dt>
                    <dd className="mt-1.5 font-semibold break-words">{value || "—"}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="font-black flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-300" />
                  {founder ? "Students you should meet" : "Projects that fit you"}
                </h3>
                {loadingMatches ? (
                  <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" /> Finding your best matches…
                  </p>
                ) : matches && matches.length ? (
                  <ul className="mt-4 space-y-3">
                    {matches.map((match) => (
                      <li
                        key={match.id}
                        className="rounded-xl border border-white/10 bg-[#09111f] p-4 flex items-center gap-4"
                      >
                        <span className="grid place-items-center h-11 w-11 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 font-black text-xs">
                          {match.matchScore}%
                        </span>
                        <div className="min-w-0">
                          <b className="block truncate">{match.title}</b>
                          {match.subtitle && (
                            <p className="text-xs text-slate-500 truncate">{match.subtitle}</p>
                          )}
                          <p className="text-xs text-cyan-200/80 mt-1">{match.matchReason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    {notice ||
                      (founder
                        ? "No matched students yet. As more people complete onboarding, your dashboard will surface them."
                        : "No open projects match yet. Your dashboard will keep looking as new projects launch.")}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* navigation */}
        <div className="flex items-center gap-3 mt-7">
          {step > 1 && (
            <button type="button" onClick={back} className="btn btn-secondary" disabled={busy}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {step < 5 ? (
              <button type="button" onClick={next} className="btn btn-primary">
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                disabled={busy}
                className="btn btn-primary disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Complete onboarding
              </button>
            )}
          </div>
        </div>
      </div>

      {/* resume prompt */}
      {pendingDraft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] p-6 text-center">
            <span className="grid place-items-center h-11 w-11 mx-auto rounded-xl bg-cyan-300/10 text-cyan-300">
              {founder ? <Rocket size={18} /> : <UserRound size={18} />}
            </span>
            <h2 className="mt-4 font-black">Continue where you left off?</h2>
            <p className="mt-2 text-sm text-slate-400">
              We saved your answers from step {pendingDraft.step || 1}. You can pick up right there.
            </p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={resumeDraft} className="btn btn-primary">
                Resume my draft
              </button>
              <button type="button" onClick={startOver} className="btn btn-secondary">
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- small form primitives ---------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-300">{label}</span>
      {hint && <span className="block text-[11px] text-slate-500 mt-0.5">{hint}</span>}
      <span className="block mt-2">{children}</span>
    </label>
  );
}

function Prose({
  label,
  hint,
  value,
  onChange,
  min,
  minChars,
  rows = 6,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  minChars?: number;
  rows?: number;
}) {
  const words = wordCount(value);
  const chars = (value || "").trim().length;
  const ready = min > 0 ? words >= min : minChars ? chars >= minChars : true;

  return (
    <label className="block">
      <span className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">
          {label}
          {hint ? <span className="ml-2 text-[11px] text-slate-500">{hint}</span> : null}
        </span>
        <span className={`text-[11px] font-bold ${ready ? "text-cyan-300" : "text-slate-500"}`}>
          {min > 0 ? `${words}/${min} words` : `${chars}/${minChars ?? 0} characters`}
        </span>
      </span>
      <textarea
        className="field mt-2"
        style={{ minHeight: `${rows * 26}px` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
