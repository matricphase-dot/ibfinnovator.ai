"use client";
import AppShell from "@/components/AppShell";
import {
  ArrowRight,
  HeartHandshake,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
const valueOptions = [
  "Integrity",
  "Impact",
  "Learning",
  "Speed",
  "Craft",
  "Transparency",
  "Inclusion",
  "Sustainability",
];
export default function Page() {
  const [profile, setProfile] = useState<any>(null),
    [matches, setMatches] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [edit, setEdit] = useState(false),
    [values, setValues] = useState<string[]>([]),
    [looking, setLooking] = useState<string[]>([]);
  async function load() {
    const p = await fetch("/api/cofounder-profile").then((r) =>
      r.ok ? r.json() : null,
    );
    setProfile(p);
    setValues(p?.values || []);
    setLooking(p?.looking_for || []);
    if (p?.enabled) {
      const r = await fetch("/api/cofounder-matches"),
        d = await r.json();
      if (r.ok) setMatches(d.matches || []);
    }
    setEdit(!p?.enabled);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  function toggle(x: string, a: string[], set: any) {
    set(a.includes(x) ? a.filter((y) => y !== x) : [...a, x]);
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      vision: f.get("vision"),
      commitment_level: f.get("commitment_level"),
      equity_expectation: f.get("equity_expectation"),
      decision_style: f.get("decision_style"),
      working_style: { pace: f.get("pace") },
      values,
      looking_for: looking,
      enabled: true,
    };
    const r = await fetch("/api/cofounder-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      toast.success("Co-founder mode enabled");
      setEdit(false);
      load();
    } else toast.error("Complete every required field");
  }
  if (loading)
    return (
      <AppShell>
        <div className="min-h-[70vh] grid place-items-center">
          <Loader2 className="animate-spin text-cyan-300" />
        </div>
      </AppShell>
    );
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex items-end">
          <div>
            <span className="pill bg-pink-50 text-pink-600">
              <HeartHandshake size={14} />
              Free co-founder mode
            </span>
            <h1 className="text-3xl font-black mt-3">
              Build with someone aligned.
            </h1>
            <p className="text-slate-500 mt-2">
              Compatibility based on values, vision, commitment and
              complementary skills.
            </p>
          </div>
          {profile?.enabled && !edit && (
            <button
              onClick={() => setEdit(true)}
              className="btn btn-secondary ml-auto"
            >
              Edit questionnaire
            </button>
          )}
        </div>
        {edit ? (
          <form
            onSubmit={save}
            className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl"
          >
            <h2 className="text-xl font-bold">
              Co-founder compatibility profile
            </h2>
            <label className="block text-sm font-bold mt-5">
              Your long-term vision *
              <textarea
                required
                minLength={30}
                name="vision"
                defaultValue={profile?.vision || ""}
                className="field mt-2 min-h-28"
                placeholder="What future are you trying to create and why?"
              />
            </label>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <label className="text-sm font-bold">
                Commitment level *
                <select
                  required
                  name="commitment_level"
                  defaultValue={profile?.commitment_level || ""}
                  className="field mt-2"
                >
                  <option value="">Select</option>
                  <option>Part-time</option>
                  <option>Full-time within 3 months</option>
                  <option>Full-time now</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Working pace
                <select name="pace" className="field mt-2">
                  <option>Fast and iterative</option>
                  <option>Balanced</option>
                  <option>Deliberate and research-led</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-bold mt-4">
              Equity expectations
              <input
                name="equity_expectation"
                defaultValue={profile?.equity_expectation || ""}
                className="field mt-2"
                placeholder="Equal split, role-based, open to discussion…"
              />
            </label>
            <label className="block text-sm font-bold mt-4">
              Decision-making style
              <textarea
                name="decision_style"
                defaultValue={profile?.decision_style || ""}
                className="field mt-2"
                placeholder="Consensus, domain ownership, CEO decides…"
              />
            </label>
            <fieldset className="mt-5">
              <legend className="text-sm font-bold">Core values *</legend>
              <div className="flex flex-wrap gap-2 mt-2">
                {valueOptions.map((x) => (
                  <button
                    type="button"
                    onClick={() => toggle(x, values, setValues)}
                    className={`pill border ${values.includes(x) ? "border-cyan-300 bg-cyan-300/10 text-cyan-300" : "border-white/10 text-slate-400"}`}
                    key={x}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-bold mt-5">
              Skills you are looking for *
              <input
                onChange={(e) =>
                  setLooking(
                    e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
                defaultValue={looking.join(", ")}
                className="field mt-2"
                placeholder="Engineering, Sales, Product…"
              />
            </label>
            <button
              disabled={!values.length || !looking.length}
              className="btn btn-primary mt-6"
            >
              <Save size={16} />
              Enable co-founder mode
            </button>
          </form>
        ) : matches.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {matches.map((x) => (
              <article className="project-cyber-card" key={x.user_id}>
                <div className="flex">
                  <span className="w-14 h-14 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center font-black">
                    {x.user.name?.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="ml-3">
                    <h2 className="font-bold">{x.user.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {x.commitment_level}
                    </p>
                  </div>
                  <span className="match-chip ml-auto">
                    <Sparkles size={11} />
                    {x.match.score}%
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-5 line-clamp-3">
                  {x.user.bio || x.vision}
                </p>
                <p className="text-xs text-cyan-300 mt-4">{x.match.reason}</p>
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-500">
                  <span>Values {x.match.breakdown.values}/40</span>
                  <span>Vision {x.match.breakdown.vision}/30</span>
                  <span>Commitment {x.match.breakdown.commitment}/20</span>
                  <span>Skills {x.match.breakdown.complementarySkills}/10</span>
                </div>
                <Link href={`/profile/${x.user_id}`} className="audience-link">
                  View compatibility <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <HeartHandshake className="mx-auto text-slate-600" size={40} />
            <h2 className="font-bold mt-4">No co-founder profiles yet</h2>
            <p className="text-sm text-slate-500 mt-2">
              New compatible profiles will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
