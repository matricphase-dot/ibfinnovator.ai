"use client";
import AppShell from "@/components/AppShell";
import { CalendarDays, Loader2, MapPin, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import EventForm from "@/components/EventForm";
type Tab = "Upcoming" | "My Events";
export default function Events() {
  const [items, setItems] = useState<any[]>([]),
    [me, setMe] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState<Tab>("Upcoming"),
    [editing, setEditing] = useState<any | false>(false);
  async function load() {
    const [events, profile] = await Promise.all([
      fetch("/api/events").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
    ]);
    setItems(events);
    setMe(profile);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function rsvp(id: string, status = "GOING") {
    const r = await fetch(`/api/events/${id}/rsvp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    r.ok ? toast.success("RSVP saved") : toast.error("Sign in to attend");
  }
  const shown = items.filter((x) => tab === "Upcoming" || x.host_id === me?.id);
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex items-end">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              IBF COMMUNITY
            </p>
            <h1 className="text-3xl font-black mt-2">
              Events, AMAs and workshops
            </h1>
            <p className="text-slate-500 mt-2">
              Learn with founders, meet collaborators and see what teams are
              building.
            </p>
          </div>
          {me && (
            <button
              onClick={() => setEditing({})}
              className="btn btn-primary ml-auto"
            >
              <Plus size={16} />
              Host an Event
            </button>
          )}
        </div>
        {me && (
          <div className="flex gap-2 mt-7">
            {(["Upcoming", "My Events"] as Tab[]).map((x) => (
              <button
                onClick={() => setTab(x)}
                className={`pill ${tab === x ? "bg-slate-900" : "bg-white border border-slate-200"}`}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {shown.map((e) => (
              <article className="project-cyber-card" key={e.id}>
                <div className="flex">
                  <span className="feature-icon">
                    <CalendarDays />
                  </span>
                  <span className="match-chip ml-auto">{e.event_type}</span>
                </div>
                <h2 className="font-bold text-lg mt-5">{e.title}</h2>
                <p className="text-sm text-slate-400 mt-3 line-clamp-3">
                  {e.description}
                </p>
                <div className="space-y-2 mt-5 text-xs text-slate-500">
                  <p className="flex gap-2">
                    <CalendarDays size={14} />
                    {new Date(e.starts_at).toLocaleString()}
                  </p>
                  <p className="flex gap-2">
                    <MapPin size={14} />
                    {e.location || "Online"}
                  </p>
                  <p className="flex gap-2">
                    <Users size={14} />
                    Hosted by {e.host?.name}
                  </p>
                </div>
                {e.host_id === me?.id ? (
                  <button
                    onClick={() => setEditing(e)}
                    className="btn btn-secondary w-full mt-5"
                  >
                    Manage event
                  </button>
                ) : (
                  me && (
                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <button
                        onClick={() => rsvp(e.id, "INTERESTED")}
                        className="btn btn-secondary"
                      >
                        Interested
                      </button>
                      <button
                        onClick={() => rsvp(e.id)}
                        className="btn btn-primary"
                      >
                        Going
                      </button>
                    </div>
                  )
                )}
              </article>
            ))}
          </div>
        )}
        {editing !== false && (
          <EventForm
            event={editing?.id ? editing : undefined}
            onSaved={load}
            onClose={() => setEditing(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
