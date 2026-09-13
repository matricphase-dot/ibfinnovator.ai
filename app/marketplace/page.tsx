"use client";
import AppShell from "@/components/AppShell";
import { BriefcaseBusiness, Loader2, Plus, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import ServiceListingForm from "@/components/ServiceListingForm";
import ServiceInquiryModal from "@/components/ServiceInquiryModal";
type Tab = "Explore" | "My Listings";
export default function Marketplace() {
  const [items, setItems] = useState<any[]>([]),
    [me, setMe] = useState<any>(null),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState<Tab>("Explore"),
    [editing, setEditing] = useState<any | false>(false),
    [inquiry, setInquiry] = useState<string | null>(null);
  async function load() {
    const [services, profile] = await Promise.all([
      fetch("/api/marketplace").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
    ]);
    setItems(services);
    setMe(profile);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  const shown = items.filter(
    (x) =>
      (tab === "Explore" || x.provider_id === me?.id) &&
      (x.title + x.description + x.skills.join(" "))
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              SERVICE MARKETPLACE
            </p>
            <h1 className="text-3xl font-black mt-2">
              Hire trusted IBF builders
            </h1>
            <p className="text-slate-500 mt-2">
              Discover and publish services backed by real collaboration
              history.
            </p>
          </div>
          {me && (
            <button
              onClick={() => setEditing({})}
              className="btn btn-primary ml-auto"
            >
              <Plus size={16} />
              List a Service
            </button>
          )}
        </div>
        {me && (
          <div className="flex gap-2 mt-7">
            {(["Explore", "My Listings"] as Tab[]).map((x) => (
              <button
                className={`pill ${tab === x ? "bg-slate-900" : "bg-white border border-slate-200"}`}
                onClick={() => setTab(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        <label className="relative block max-w-xl mt-5">
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
        ) : shown.length ? (
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
                  {x.provider?.username && (
                    <span className="text-xs text-cyan-300 ml-2">
                      @{x.provider.username}
                    </span>
                  )}
                  <span className="float-right text-amber-300 text-xs">
                    <Star size={12} className="inline" />{" "}
                    {x.provider?.average_rating || "New"}
                  </span>
                  <p className="text-xs text-cyan-300 mt-2">
                    {x.pricing_note || "Contact for terms"}
                  </p>
                </div>
                {x.provider_id === me?.id ? (
                  <button
                    onClick={() => setEditing(x)}
                    className="btn btn-secondary w-full mt-4"
                  >
                    Edit listing
                  </button>
                ) : (
                  me && (
                    <button
                      onClick={() => setInquiry(x.id)}
                      className="btn btn-primary w-full mt-4"
                    >
                      Contact Provider
                    </button>
                  )
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500">
            No service listings found.
          </div>
        )}
        {editing !== false && (
          <ServiceListingForm
            service={editing?.id ? editing : undefined}
            onSaved={load}
            onClose={() => setEditing(false)}
          />
        )}{" "}
        {inquiry && (
          <ServiceInquiryModal
            serviceId={inquiry}
            onClose={() => setInquiry(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
