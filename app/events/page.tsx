"use client";
import AppShell from "@/components/AppShell";
import { CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function Events() {
  const [items, setItems] = useState<any[]>([]),
    [loading, setLoading] = useState(true);
  async function load() {
    const r = await fetch("/api/events");
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function join(id: string) {
    const r = await fetch("/api/events", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event_id: id, status: "GOING" }),
    });
    r.ok
      ? toast.success("You are attending")
      : toast.error("Sign in to attend");
  }
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          IBF COMMUNITY
        </p>
        <h1 className="text-3xl font-black mt-2">Events, AMAs and workshops</h1>
        <p className="text-slate-500 mt-2">
          Learn with founders, meet collaborators and see what teams are
          building.
        </p>
        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {items.map((e) => (
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
                <button
                  onClick={() => join(e.id)}
                  className="btn btn-primary w-full mt-5"
                >
                  Attend event
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
