"use client";
import AppShell from "@/components/AppShell";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const mapProject = (x: any, match?: any) => ({
  id: x.id,
  title: x.title,
  desc: x.description,
  domain: x.domain || "Startup",
  stage: x.stage || "IDEA",
  match: match?.score || 0,
  skills: x.required_skills || [],
  founder: x.founder?.name || "IBF Founder",
  initials: (x.title || "IB").slice(0, 2),
  color: "#00f5d4",
  commit: x.commitment_hours ? `${x.commitment_hours} hrs/wk` : "Flexible",
  type: x.engagement_type || "Collaboration",
});

export default function Dashboard() {
  const [d, setD] = useState<any>(null),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const urls = [
      "/api/profile",
      "/api/projects",
      "/api/connections",
      "/api/notifications",
      "/api/matches",
      "/api/bookmarks",
    ];
    const [profile, projects, connections, notifications, matches, bookmarks] =
      await Promise.all(
        urls.map((u) =>
          fetch(u, { cache: "no-store" })
            .then(async (r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
    setD({
      profile: profile || {},
      projects: projects?.projects || [],
      connections: Array.isArray(connections) ? connections : [],
      notifications: Array.isArray(notifications) ? notifications : [],
      matches: matches?.matches || [],
      bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
    });
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function respond(id: string, status: "ACCEPTED" | "REJECTED") {
    const r = await fetch(`/api/connections/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      toast.success(`Request ${status.toLowerCase()}`);
      load();
    } else toast.error("Could not update request");
  }
  if (loading)
    return (
      <AppShell>
        <div className="min-h-[70vh] grid place-items-center">
          <Loader2 className="animate-spin text-cyan-300" />
        </div>
      </AppShell>
    );
  const p = d.profile,
    founder = p.role === "FOUNDER" || p.role === "SUPER_ADMIN";
  const own = d.projects.filter((x: any) => x.founder_id === p.id),
    accepted = d.connections.filter((x: any) => x.status === "ACCEPTED"),
    pending = d.connections.filter((x: any) => x.status === "PENDING");
  const metrics = founder
    ? [
        [BriefcaseBusiness, "Your projects", own.length],
        [Users, "Connections", accepted.length],
        [MessageSquare, "Pending requests", pending.length],
        [
          Star,
          "Open projects",
          own.filter((x: any) => x.status === "OPEN").length,
        ],
      ]
    : [
        [
          Star,
          "Strong matches",
          d.matches.filter((x: any) => x.match?.score >= 70).length,
        ],
        [Users, "Connections", accepted.length],
        [MessageSquare, "Pending requests", pending.length],
        [Bookmark, "Saved items", d.bookmarks.length],
      ];
  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="text-3xl font-black mt-1">
              Welcome, {p.name?.split(" ")[0] || "Builder"} 👋
            </h1>
            <p className="text-slate-500 mt-2">
              Your live {founder ? "founder" : "builder"} workspace and
              collaboration activity.
            </p>
          </div>
          <Link
            href={founder ? "/projects/new" : "/matches"}
            className="btn btn-primary ml-auto"
          >
            {founder ? <Plus size={17} /> : <Star size={17} />}{" "}
            {founder ? "Submit project" : "Discover matches"}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {metrics.map(([Icon, label, value]: any) => (
            <div
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start"
              key={label}
            >
              <span className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl grid place-items-center">
                <Icon size={19} />
              </span>
              <div className="ml-4">
                <p className="text-xs text-slate-500 font-semibold">{label}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
                <p className="text-[10px] text-cyan-300 mt-1">LIVE DATA</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid xl:grid-cols-[1fr_340px] gap-6 mt-7">
          <section>
            <div className="flex items-center mb-4">
              <h2 className="font-extrabold text-lg">
                {founder ? "Your projects" : "Top matches for you"}
              </h2>
              <Link
                href={founder ? "/projects" : "/matches"}
                className="ml-auto text-sm text-cyan-300 font-bold flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {founder ? (
              own.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {own.slice(0, 4).map((x: any) => (
                    <ProjectCard p={mapProject(x)} key={x.id} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No projects yet"
                  text="Publish your first project to start discovering talent."
                  href="/projects/new"
                  action="Submit project"
                />
              )
            ) : d.matches.length ? (
              <div className="grid md:grid-cols-2 gap-4">
                {d.matches.slice(0, 2).map((x: any) => (
                  <ProjectCard p={mapProject(x, x.match)} key={x.id} />
                ))}
              </div>
            ) : (
              <Empty
                title="No matches yet"
                text="Add skills and interests, then check again when founders publish projects."
                href="/settings"
                action="Improve profile"
              />
            )}
            <div className="flex items-center mt-8 mb-4">
              <h2 className="font-extrabold text-lg">Connections</h2>
              <span className="ml-auto text-xs text-slate-500">
                {accepted.length} accepted
              </span>
            </div>
            {d.connections.length ? (
              <div className="space-y-3">
                {d.connections.slice(0, 6).map((c: any) => (
                  <ConnectionRow
                    key={c.id}
                    c={c}
                    userId={p.id}
                    respond={respond}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No connection activity yet.
              </p>
            )}
          </section>
          <aside>
            <h2 className="font-extrabold text-lg mb-4">Recent activity</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
              {d.notifications.length ? (
                d.notifications.slice(0, 7).map((n: any) => (
                  <Link
                    href={n.link || "/notifications"}
                    className="flex gap-3"
                    key={n.id}
                  >
                    <span className="shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 grid place-items-center text-[10px] font-bold">
                      IB
                    </span>
                    <div>
                      <p className="text-xs font-bold">
                        {n.type.replaceAll("_", " ")}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {n.message}
                      </p>
                    </div>
                    <time className="ml-auto text-[9px] text-slate-600">
                      {new Date(n.created_at).toLocaleDateString()}
                    </time>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No notifications yet.</p>
              )}
            </div>
            <div className="mt-5 rounded-2xl p-5 border border-cyan-300/15 bg-cyan-300/[.05]">
              <Star className="text-cyan-300" size={20} />
              <b className="block mt-3">Improve match quality</b>
              <p className="text-xs text-slate-500 mt-2 leading-5">
                Complete skills, interests, availability and bio for accurate
                recommendations.
              </p>
              <Link
                href="/settings"
                className="btn btn-primary mt-4 !py-2 text-xs"
              >
                Update profile
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
function ConnectionRow({
  c,
  userId,
  respond,
}: {
  c: any;
  userId: string;
  respond: (id: string, status: "ACCEPTED" | "REJECTED") => void;
}) {
  const incoming = c.recipient_id === userId,
    person = incoming ? c.requester : c.recipient;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center">
      <span className="h-9 w-9 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
        {person?.name?.slice(0, 2).toUpperCase() || "IB"}
      </span>
      <div className="ml-3">
        <b className="text-sm">{person?.name || "IBF member"}</b>
        <p className="text-xs text-slate-500 mt-1">
          {c.project?.title || c.type} · {c.status}
        </p>
      </div>
      {incoming && c.status === "PENDING" ? (
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => respond(c.id, "REJECTED")}
            className="btn btn-secondary !py-2 text-xs"
          >
            Decline
          </button>
          <button
            onClick={() => respond(c.id, "ACCEPTED")}
            className="btn btn-primary !py-2 text-xs"
          >
            Accept
          </button>
        </div>
      ) : (
        <span className="ml-auto pill bg-cyan-300/10 text-cyan-300">
          {c.status}
        </span>
      )}
    </div>
  );
}
function Empty({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="py-16 border border-dashed border-white/10 rounded-2xl text-center">
      <BriefcaseBusiness className="mx-auto text-slate-600" />
      <h3 className="font-bold mt-4">{title}</h3>
      <p className="text-sm text-slate-500 mt-2">{text}</p>
      <Link href={href} className="btn btn-primary mt-5">
        {action}
      </Link>
    </div>
  );
}
