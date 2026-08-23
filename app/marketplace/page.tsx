"use client";
import AppShell from "@/components/AppShell";
import { BriefcaseBusiness, Loader2, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
export default function Marketplace() {
  const [items, setItems] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/marketplace")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  const shown = items.filter((x) =>
    (x.title + x.description + x.skills.join(" "))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          SERVICE MARKETPLACE
        </p>
        <h1 className="text-3xl font-black mt-2">Hire trusted IBF builders</h1>
        <p className="text-slate-500 mt-2">
          Discover services offered by students, professionals and experienced
          collaborators.
        </p>
        <label className="relative block max-w-xl mt-7">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field pl-10"
            placeholder="Search services or skills"
          />
        </label>
        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {shown.map((x) => (
              <article className="project-cyber-card" key={x.id}>
                <span className="feature-icon">
                  <BriefcaseBusiness />
                </span>
                <h2 className="font-bold text-lg mt-4">{x.title}</h2>
                <p className="text-sm text-slate-400 mt-3 line-clamp-3">
                  {x.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-4">
                  {x.skills.map((s: string) => (
                    <span className="tech-chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/[.07]">
                  <b className="text-sm">{x.provider?.name}</b>
                  <span className="float-right text-amber-300 text-xs">
                    <Star size={12} className="inline" />{" "}
                    {x.provider?.average_rating || "New"}
                  </span>
                  <p className="text-xs text-cyan-300 mt-2">
                    {x.pricing_note || "Contact for terms"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
