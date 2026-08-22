"use client";
import AppShell from "@/components/AppShell";
import ProjectCard from "@/components/ProjectCard";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Loader2,
  UserRound,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
const projectCard = (x: any) => ({
  id: x.id,
  title: x.title,
  desc: x.description,
  domain: x.domain || "Startup",
  stage: x.stage || "IDEA",
  match: x.match?.score || 0,
  skills: x.required_skills || [],
  founder: x.founder?.name || "IBF Founder",
  initials: (x.title || "IB").slice(0, 2),
  color: "#00f5d4",
  commit: x.commitment_hours ? `${x.commitment_hours} hrs/wk` : "Flexible",
  type: x.engagement_type || "Collaboration",
});
export default function Matches() {
  const [q, setQ] = useState(""),
    [items, setItems] = useState<any[]>([]),
    [type, setType] = useState("PROJECTS"),
    [loading, setLoading] = useState(true),
    [min, setMin] = useState(0);
  useEffect(() => {
    fetch("/api/matches", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) {
          setItems(d.matches || []);
          setType(d.type);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  const list = items.filter((x) => {
    const text =
      type === "PROJECTS"
        ? [x.title, x.domain, ...(x.required_skills || [])].join(" ")
        : [x.name, x.bio, ...(x.skills || [])].join(" ");
    return (
      text.toLowerCase().includes(q.toLowerCase()) &&
      (x.match?.score || 0) >= min
    );
  });
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-5 md:p-8">
        <span className="pill bg-violet-100 text-violet-700">
          <Sparkles size={13} />
          Calculated from live profiles
        </span>
        <h1 className="text-3xl font-black mt-3">
          {type === "PROJECTS"
            ? "Projects that fit you"
            : "Talent that fits your project"}
        </h1>
        <p className="text-slate-500 mt-2">
          Ranked by skills, domain alignment, availability and engagement
          preference.
        </p>
        <div className="flex gap-3 mt-7">
          <label className="relative flex-1 max-w-xl">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="field pl-10"
              placeholder="Search names, projects, skills, or domains"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="btn btn-secondary">
            <SlidersHorizontal size={17} />
            <select
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="bg-transparent outline-none text-xs"
            >
              <option value="0">All scores</option>
              <option value="50">50%+</option>
              <option value="70">70%+</option>
              <option value="90">90%+</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-slate-500 mt-7">
          <b className="text-slate-900">{list.length} live matches</b> based on
          your current profile
        </p>
        {loading ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : list.length ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-4">
            {type === "PROJECTS"
              ? list.map((x) => <ProjectCard p={projectCard(x)} key={x.id} />)
              : list.map((x) => (
                  <article className="project-cyber-card" key={x.id}>
                    <div className="flex">
                      <span className="h-12 w-12 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center font-black">
                        {x.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2) || "IB"}
                      </span>
                      <div className="ml-3">
                        <h2 className="font-bold text-white">{x.name}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {x.availability || "Availability not set"}
                        </p>
                      </div>
                      <span className="match-chip ml-auto">
                        <Sparkles size={11} />
                        {x.match?.score || 0}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-5 line-clamp-3">
                      {x.bio || "This builder has not added a bio yet."}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {x.skills?.slice(0, 5).map((s: string) => (
                        <span className="tech-chip" key={s}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-cyan-300 mt-5">
                      {x.match?.reason}
                    </p>
                    <Link href={`/profile/${x.id}`} className="audience-link">
                      View profile <ArrowRight size={14} />
                    </Link>
                  </article>
                ))}
          </div>
        ) : (
          <div className="mt-6 py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <UserRound className="mx-auto text-slate-600" size={38} />
            <h2 className="font-bold mt-4">No matches yet</h2>
            <p className="text-sm text-slate-500 mt-2">
              Complete your profile or publish an open project to generate
              matches.
            </p>
            <Link href="/settings" className="btn btn-primary mt-5">
              Improve profile
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
