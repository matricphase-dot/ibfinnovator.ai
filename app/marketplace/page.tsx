"use client";

import AppShell from "@/components/AppShell";
import ServiceInquiryModal from "@/components/ServiceInquiryModal";
import ServiceListingForm, {
  type ServiceListing,
} from "@/components/ServiceListingForm";
import {
  BriefcaseBusiness,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Marketplace() {
  const [items, setItems] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceListing | null>(null);

  const load = useCallback(async () => {
    const [browse, profile] = await Promise.all([
      fetch("/api/marketplace", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    setItems(Array.isArray(browse) ? browse : []);
    setMe(profile);
    if (profile?.id) {
      const own = await fetch("/api/marketplace?mine=1", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : [],
      );
      setMine(Array.isArray(own) ? own : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(listing: any) {
    if (!window.confirm(`Delete "${listing.title}"? Its inquiries are removed too.`))
      return;
    const response = await fetch(`/api/marketplace/${listing.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Listing deleted");
      void load();
    } else {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || "Could not delete this listing");
    }
  }

  const signedIn = Boolean(me?.id);
  const shown = items.filter((x) =>
    `${x.title} ${x.description} ${(x.skills ?? []).join(" ")}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              SERVICE MARKETPLACE
            </p>
            <h1 className="text-3xl font-black mt-2">Hire trusted IBF builders</h1>
            <p className="text-slate-500 mt-2">
              Discover services offered by students, professionals and experienced
              collaborators.
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href="/marketplace/inquiries" className="btn btn-secondary text-xs">
              <Inbox size={15} />
              Inquiries
            </Link>
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="btn btn-primary text-xs"
              >
                <Plus size={15} />
                List a service
              </button>
            ) : (
              <Link href="/auth/signin" className="btn btn-primary text-xs">
                <Plus size={15} />
                List a service
              </Link>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-7">
          {(["browse", "mine"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`pill ${
                tab === key
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-400 hover:text-cyan-300"
              }`}
            >
              {key === "browse" ? "Browse services" : `My listings${mine.length ? ` (${mine.length})` : ""}`}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <>
            <label className="relative block max-w-xl mt-6">
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
            ) : shown.length === 0 ? (
              <p className="text-sm text-slate-500 mt-10">
                No services match that search yet.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
                {shown.map((x) => {
                  const isOwner = Boolean(me?.id) && x.provider?.id === me.id;
                  return (
                    <article className="project-cyber-card flex flex-col" key={x.id}>
                      <span className="feature-icon">
                        <BriefcaseBusiness />
                      </span>
                      <h2 className="font-bold text-lg mt-4">{x.title}</h2>
                      <p className="text-sm text-slate-400 mt-3 line-clamp-3">
                        {x.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-4">
                        {(x.skills ?? []).map((s: string) => (
                          <span className="tech-chip" key={s}>
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/[.07]">
                        <b className="text-sm">{x.provider?.name || "IBF member"}</b>
                        <span className="float-right text-amber-300 text-xs">
                          <Star size={12} className="inline" />{" "}
                          {x.provider?.average_rating || "New"}
                        </span>
                        <p className="text-xs text-cyan-300 mt-2">
                          {x.pricing_note || "Contact for terms"}
                        </p>
                        {x.availability && (
                          <p className="text-xs text-slate-500 mt-1">{x.availability}</p>
                        )}
                      </div>
                      <div className="mt-4">
                        {isOwner ? (
                          <p className="text-xs text-slate-500 text-center">
                            This is your listing
                          </p>
                        ) : signedIn ? (
                          <ServiceInquiryModal
                            serviceId={x.id}
                            serviceTitle={x.title}
                            providerName={x.provider?.name}
                          />
                        ) : (
                          <Link href="/auth/signin" className="btn btn-secondary w-full !py-2 text-xs">
                            Sign in to contact
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "mine" && (
          <>
            {!signedIn ? (
              <p className="text-sm text-slate-500 mt-8">
                <Link href="/auth/signin" className="text-cyan-300 font-bold">
                  Sign in
                </Link>{" "}
                to manage your listings.
              </p>
            ) : loading ? (
              <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
            ) : mine.length === 0 ? (
              <div className="py-16 text-center">
                <BriefcaseBusiness className="mx-auto text-slate-600" size={40} />
                <h2 className="font-bold mt-4">No listings yet</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Publish a service and members can start sending you inquiries.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="btn btn-primary mt-6 text-xs"
                >
                  <Plus size={15} />
                  List a service
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
                {mine.map((x) => (
                  <article className="project-cyber-card flex flex-col" key={x.id}>
                    <div className="flex items-center">
                      <span className="feature-icon">
                        <BriefcaseBusiness />
                      </span>
                      <span
                        className={`match-chip ml-auto ${
                          x.status === "ACTIVE" ? "" : "opacity-60"
                        }`}
                      >
                        {x.status}
                      </span>
                    </div>
                    <h2 className="font-bold text-lg mt-4">{x.title}</h2>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-3">
                      {x.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-4">
                      {(x.skills ?? []).map((s: string) => (
                        <span className="tech-chip" key={s}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({
                            id: x.id,
                            title: x.title,
                            description: x.description,
                            skills: x.skills ?? [],
                            pricing_note: x.pricing_note,
                            availability: x.availability,
                            status: x.status,
                          });
                          setFormOpen(true);
                        }}
                        className="btn btn-secondary flex-1 !py-2 text-xs"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(x)}
                        aria-label={`Delete ${x.title}`}
                        className="btn btn-secondary !py-2 text-xs text-rose-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ServiceListingForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
      />
    </AppShell>
  );
}
