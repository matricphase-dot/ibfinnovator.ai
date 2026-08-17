"use client";
import NavBar from "@/components/NavBar";
import ProjectCard from "@/components/ProjectCard";
import { Search, Plus, Loader2, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Projects() {
  const [items, setItems] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/projects${q ? `?search=${encodeURIComponent(q)}` : ""}`)
        .then((r) => r.json())
        .then((d) => setItems(d.projects || []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <>
      <NavBar />
      <div className="bg-[#0d1322] text-white py-14 border-b border-white/[.06]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div>
              <p className="text-cyan-300 font-bold text-[10px] tracking-[.2em]">
                LIVE PROJECT DIRECTORY
              </p>
              <h1 className="text-4xl font-black mt-3">
                Find something worth building.
              </h1>
              <p className="text-slate-400 mt-3">
                Explore real projects published by the IBF founder community.
              </p>
            </div>
            <Link href="/projects/new" className="btn btn-primary md:ml-auto">
              <Plus size={17} />
              Submit your project
            </Link>
          </div>
          <label className="relative block max-w-2xl mt-7">
            <Search
              className="absolute left-4 top-4 text-slate-500"
              size={20}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="field py-4 pl-12"
              placeholder="Search by project, domain, or skill…"
            />
          </label>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center mb-7">
          <p className="text-sm text-slate-500">
            <b className="text-white">{items.length}</b> open projects
          </p>
          <Link
            href="/projects/new"
            className="ml-auto text-xs text-cyan-300 font-bold flex gap-1"
          >
            <Plus size={14} />
            Founder? Publish a project
          </Link>
        </div>
        {loading ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : items.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((x) => (
              <ProjectCard
                key={x.id}
                p={{
                  id: x.id,
                  title: x.title,
                  desc: x.description,
                  domain: x.domain || "Startup",
                  stage: x.stage || "IDEA",
                  match: 0,
                  skills: x.required_skills || [],
                  founder: x.founder?.name || "IBF Founder",
                  initials: (x.title || "IB").slice(0, 2),
                  color: "#00f5d4",
                  commit: x.commitment_hours
                    ? `${x.commitment_hours} hrs/wk`
                    : "Flexible",
                  type: x.engagement_type || "Collaboration",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <FolderKanban size={40} className="mx-auto text-slate-600" />
            <h2 className="text-xl font-bold mt-4">
              Be the first to publish a project
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Describe what you are building and the skills you need.
            </p>
            <Link href="/projects/new" className="btn btn-primary mt-6">
              <Plus size={16} />
              Submit project
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
