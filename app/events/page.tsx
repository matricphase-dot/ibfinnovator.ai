"use client";

import AppShell from "@/components/AppShell";
import EventForm, { type CommunityEvent } from "@/components/EventForm";
import {
  CalendarDays,
  CalendarPlus,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Upcoming events and the ones you host.
 *
 * RSVPs go through POST /api/events/<id>/rsvp; the map of the caller's existing
 * RSVPs arrives in one request from GET /api/events/rsvp so each card can
 * highlight the chosen state without a request per card.
 */

const RSVP_OPTIONS = [
  { value: "GOING", label: "Going" },
  { value: "INTERESTED", label: "Interested" },
  { value: "CANCELLED", label: "Not going" },
] as const;

type RsvpStatus = (typeof RSVP_OPTIONS)[number]["value"];

export default function Events() {
  const [items, setItems] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"upcoming" | "mine">("upcoming");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityEvent | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const [upcoming, profile] = await Promise.all([
      fetch("/api/events", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    setItems(Array.isArray(upcoming) ? upcoming : []);
    setMe(profile);

    if (profile?.id) {
      const [own, myRsvps] = await Promise.all([
        fetch("/api/events?mine=1", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch("/api/events/rsvp", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : { rsvps: {} },
        ),
      ]);
      setMine(Array.isArray(own) ? own : []);
      setRsvps(myRsvps?.rsvps ?? {});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function rsvp(eventId: string, status: RsvpStatus) {
    setBusy(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (response.ok) {
        setRsvps((prev) => ({ ...prev, [eventId]: status }));
        toast.success(
          status === "CANCELLED"
            ? "RSVP cancelled"
            : status === "INTERESTED"
              ? "Marked as interested"
              : "You are attending",
        );
        void load();
      } else if (response.status === 409) {
        toast.error(payload.error || "This event is no longer accepting RSVPs.");
      } else if (response.status === 401) {
        toast.error("Sign in to RSVP");
      } else {
        toast.error(payload.error || "Could not save your RSVP");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setBusy("");
    }
  }

  async function remove(event: any) {
    if (!window.confirm(`Delete "${event.title}"? RSVPs are removed too.`)) return;
    const response = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Event deleted");
      void load();
    } else {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || "Could not delete this event");
    }
  }

  const signedIn = Boolean(me?.id);
  const rows = tab === "upcoming" ? items : mine;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              IBF COMMUNITY
            </p>
            <h1 className="text-3xl font-black mt-2">Events, AMAs and workshops</h1>
            <p className="text-slate-500 mt-2">
              Learn with founders, meet collaborators and see what teams are
              building.
            </p>
          </div>
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn btn-primary text-xs ml-auto"
            >
              <CalendarPlus size={15} />
              Host an event
            </button>
          ) : (
            <Link href="/auth/signin" className="btn btn-primary text-xs ml-auto">
              <CalendarPlus size={15} />
              Host an event
            </Link>
          )}
        </div>

        <div className="flex gap-2 mt-7">
          {(["upcoming", "mine"] as const).map((key) => (
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
              {key === "upcoming" ? "Upcoming" : `My events${mine.length ? ` (${mine.length})` : ""}`}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
        ) : !signedIn && tab === "mine" ? (
          <p className="text-sm text-slate-500 mt-8">
            <Link href="/auth/signin" className="text-cyan-300 font-bold">
              Sign in
            </Link>{" "}
            to host and manage events.
          </p>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto text-slate-600" size={40} />
            <h2 className="font-bold mt-4">
              {tab === "upcoming" ? "No upcoming events" : "You are not hosting anything yet"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {tab === "upcoming"
                ? "Check back soon, or host something yourself."
                : "Publish an event and the community can RSVP."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {rows.map((e) => {
              const myRsvp = rsvps[e.id];
              const isHost = Boolean(me?.id) && e.host_id === me.id;
              const attendees = e.attendees?.[0]?.count;
              return (
                <article className="project-cyber-card flex flex-col" key={e.id}>
                  <div className="flex">
                    <span className="feature-icon">
                      <CalendarDays />
                    </span>
                    <span className="match-chip ml-auto">{e.event_type}</span>
                  </div>
                  <h2 className="font-bold text-lg mt-5">{e.title}</h2>
                  <p className="text-sm text-slate-400 mt-3 line-clamp-3">{e.description}</p>
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
                      {isHost ? "Hosted by you" : `Hosted by ${e.host?.name || "an IBF member"}`}
                      {typeof attendees === "number" && ` · ${attendees} going`}
                    </p>
                    {e.status && e.status !== "PUBLISHED" && (
                      <p className="text-rose-300">Status: {e.status}</p>
                    )}
                  </div>

                  {tab === "upcoming" && (
                    <div className="mt-auto pt-5">
                      {signedIn ? (
                        <div className="flex gap-1">
                          {RSVP_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              disabled={busy === e.id}
                              onClick={() => void rsvp(e.id, option.value)}
                              className={`pill flex-1 justify-center border disabled:opacity-50 ${
                                myRsvp === option.value
                                  ? "bg-cyan-300 text-slate-950 border-cyan-300"
                                  : "bg-white/5 text-slate-400 border-white/10 hover:text-cyan-300"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Link href="/auth/signin" className="btn btn-secondary w-full !py-2 text-xs">
                          Sign in to RSVP
                        </Link>
                      )}
                    </div>
                  )}

                  {tab === "mine" && (
                    <div className="flex gap-2 mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({
                            id: e.id,
                            title: e.title,
                            description: e.description,
                            event_type: e.event_type,
                            starts_at: e.starts_at,
                            ends_at: e.ends_at,
                            location: e.location,
                            capacity: e.capacity,
                            status: e.status,
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
                        onClick={() => void remove(e)}
                        aria-label={`Delete ${e.title}`}
                        className="btn btn-secondary !py-2 text-xs text-rose-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <EventForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
      />
    </AppShell>
  );
}
