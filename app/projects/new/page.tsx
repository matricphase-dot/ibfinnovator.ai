"use client";
import AppShell from "@/components/AppShell";
import { FormEvent, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
export default function NewProject() {
  const [skills, setSkills] = useState<string[]>([]),
    [skill, setSkill] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      title: String(f.get("title") || "").trim(),
      description: String(f.get("description") || "").trim(),
      domain: String(f.get("domain") || "").trim(),
      stage: f.get("stage"),
      required_skills: skills,
      engagement_type: f.get("engagement_type"),
      commitment_hours: Number(f.get("commitment_hours")),
      duration_weeks: Number(f.get("duration_weeks")),
    };
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet and try again.");
      setLoading(false);
      return;
    }
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
      const text = await r.text();
      let d: any = {};
      try {
        d = text ? JSON.parse(text) : {};
      } catch {
        d = { error: text || `Server returned ${r.status}` };
      }
      if (!r.ok) {
        const message =
          typeof d.error === "string"
            ? d.error
            : d.error?.formErrors?.[0] ||
              "Please check every field and try again.";
        setError(
          r.status === 401
            ? "Your session expired. Sign in again before publishing."
            : r.status === 403
              ? "Only Founder accounts can publish projects."
              : message,
        );
        return;
      }
      if (!d.id) {
        setError(
          "The project was saved but no project ID was returned. Open Projects to verify it.",
        );
        return;
      }
      window.location.assign(`/projects/${d.id}`);
    } catch (err: any) {
      setError(
        err?.name === "AbortError"
          ? "The request timed out. Your project may have been saved—check the Projects page before trying again."
          : "The network connection closed before the server responded. Refresh the page and try again; if you already clicked Publish, check Projects first to avoid a duplicate.",
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }
  function add() {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkill("");
  }
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-5 md:p-8">
        <p className="text-xs tracking-widest font-black text-violet-600">
          FOUNDER WORKSPACE
        </p>
        <h1 className="text-3xl font-black mt-2">Create a real project</h1>
        <p className="text-slate-500 mt-2">
          Your project will be saved to Supabase and immediately enter matching.
        </p>
        <form
          onSubmit={submit}
          className="bg-white border border-slate-200 rounded-3xl p-7 mt-7 space-y-5"
        >
          <label className="block text-sm font-bold">
            Project title
            <input
              required
              name="title"
              minLength={3}
              className="field mt-2"
              placeholder="e.g. EcoTrack AI"
            />
          </label>
          <label className="block text-sm font-bold">
            Description
            <textarea
              required
              name="description"
              minLength={20}
              className="field mt-2 min-h-32"
              placeholder="What are you building and why does it matter?"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-bold">
              Domain
              <input
                name="domain"
                className="field mt-2"
                placeholder="Climate Tech"
              />
            </label>
            <label className="text-sm font-bold">
              Stage
              <select name="stage" className="field mt-2">
                <option>IDEA</option>
                <option>MVP</option>
                <option>BETA</option>
                <option>REVENUE</option>
                <option>FUNDED</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-bold">
            Required skills
            <div className="flex gap-2 mt-2">
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                className="field"
                placeholder="Type a skill and press Enter"
              />
              <button type="button" onClick={add} className="btn btn-secondary">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((s) => (
                <span className="pill bg-violet-50 text-violet-700">
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </label>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="text-sm font-bold">
              Engagement
              <select name="engagement_type" className="field mt-2">
                <option>EQUITY</option>
                <option>STIPEND</option>
                <option>VOLUNTEER</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Hours/week
              <input
                required
                name="commitment_hours"
                type="number"
                min="1"
                max="80"
                className="field mt-2"
                defaultValue="10"
              />
            </label>
            <label className="text-sm font-bold">
              Duration (weeks)
              <input
                required
                name="duration_weeks"
                type="number"
                min="1"
                className="field mt-2"
                defaultValue="12"
              />
            </label>
          </div>
          {error && (
            <div className="p-4 border border-red-400/20 bg-red-400/[.06] text-red-300 rounded-xl text-sm">
              <p>{error}</p>
              <a
                href="/projects"
                className="inline-block mt-2 text-cyan-300 font-bold"
              >
                Check published projects →
              </a>
            </div>
          )}
          <button
            disabled={loading || !skills.length}
            className="btn btn-primary w-full"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : null}
            {loading ? "Publishing securely…" : "Publish project"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
