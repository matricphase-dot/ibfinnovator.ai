"use client";
import NavBar from "@/components/NavBar";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  CalendarDays,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<any>(null),
    [me, setMe] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      }),
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([project, profile]) => {
        setP(project);
        setMe(profile);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
  async function bookmark() {
    setBusy("bookmark");
    const r = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: id }),
    });
    const d = await r.json();
    setBusy("");
    r.ok
      ? toast.success(d.bookmarked ? "Project saved" : "Bookmark removed")
      : toast.error(d.error || "Sign in to bookmark");
  }
  async function connect() {
    setBusy("connect");
    const r = await fetch("/api/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient_id: p.founder_id,
        project_id: id,
        type: "PROJECT",
      }),
    });
    const d = await r.json();
    setBusy("");
    r.ok
      ? toast.success("Connection request sent")
      : toast.error(
          d.error?.includes("duplicate")
            ? "Request already sent"
            : d.error || "Sign in to connect",
        );
  }
  async function share() {
    await navigator.clipboard.writeText(location.href);
    toast.success("Project link copied");
  }
  if (loading)
    return (
      <>
        <NavBar />
        <div className="min-h-[70vh] grid place-items-center">
          <Loader2 className="animate-spin text-cyan-300" />
        </div>
      </>
    );
  if (error || !p)
    return (
      <>
        <NavBar />
        <div className="min-h-[70vh] grid place-items-center text-center">
          <div>
            <BriefcaseBusiness className="mx-auto text-slate-600" size={44} />
            <h1 className="text-2xl font-black mt-4">Project not found</h1>
            <p className="text-slate-500 mt-2">{error}</p>
            <Link href="/projects" className="btn btn-primary mt-6">
              Return to projects
            </Link>
          </div>
        </div>
      </>
    );
  const created = new Date(p.created_at);
  const isOwner = me?.id === p.founder_id;
  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-9">
        <div className="flex items-center">
          <Link
            href="/projects"
            className="text-sm text-slate-500 hover:text-cyan-300 flex items-center gap-2"
          >
            <ArrowLeft size={15} />
            All projects
          </Link>
          <button onClick={share} className="ml-auto btn btn-secondary !py-2">
            <Share2 size={15} />
            Share
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 mt-7">
          <article className="bg-white border border-slate-200 rounded-3xl p-7 md:p-9">
            <div className="flex items-start">
              <span className="w-16 h-16 shrink-0 rounded-2xl bg-cyan-300 text-slate-950 grid place-items-center font-black text-xl">
                {p.title.slice(0, 2).toUpperCase()}
              </span>
              <div className="ml-5">
                <div className="flex flex-wrap gap-2">
                  <span className="pill bg-emerald-50 text-emerald-700">
                    {p.status}
                  </span>
                  <span className="pill bg-slate-100">{p.stage || "IDEA"}</span>
                  {p.engagement_type && (
                    <span className="pill bg-slate-100">
                      {p.engagement_type}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black mt-3 text-white">
                  {p.title}
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  {p.domain || "Startup"} · Published{" "}
                  {created.toLocaleDateString()}
                </p>
              </div>
            </div>
            <hr className="my-8 border-slate-100" />
            <Section title="What we’re building" text={p.description} />
            {p.problem_statement && (
              <Section title="The problem" text={p.problem_statement} />
            )}{" "}
            {p.solution_overview && (
              <Section title="Our solution" text={p.solution_overview} />
            )}
            <h2 className="font-extrabold text-lg mt-8">
              Skills we’re looking for
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {p.required_skills?.map((x: string) => (
                <span key={x} className="pill bg-violet-50 text-violet-700">
                  {x}
                </span>
              ))}
            </div>
            <h2 className="font-extrabold text-lg mt-8">Project milestones</h2>
            {p.milestones?.length ? (
              p.milestones.map((x: any) => (
                <div className="flex gap-3 mt-4" key={x.id}>
                  <span
                    className={`w-6 h-6 rounded-full grid place-items-center ${x.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Check size={14} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{x.title}</p>
                    {x.due_date && (
                      <p className="text-xs text-slate-500 mt-1">
                        Due {new Date(x.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 mt-3">
                The founder has not published milestones yet.
              </p>
            )}
          </article>
          <aside>
            <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6">
              <span className="pill bg-emerald-50 text-emerald-700">
                <Sparkles size={13} />
                Open for collaboration
              </span>
              <h3 className="font-extrabold mt-5">Project commitment</h3>
              <div className="space-y-4 my-5 py-5 border-y border-slate-100 text-sm">
                <p className="flex gap-2">
                  <Clock size={17} className="text-slate-400" />
                  {p.commitment_hours
                    ? `${p.commitment_hours} hours/week`
                    : "Flexible hours"}
                </p>
                <p className="flex gap-2">
                  <CalendarDays size={17} className="text-slate-400" />
                  {p.duration_weeks
                    ? `${p.duration_weeks} weeks`
                    : "Open duration"}
                </p>
                <p className="flex gap-2">
                  <MapPin size={17} className="text-slate-400" />
                  Remote collaboration
                </p>
              </div>
              {isOwner ? (
                <div className="p-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] text-center">
                  <p className="text-xs text-cyan-300 font-bold">
                    THIS IS YOUR PROJECT
                  </p>
                  <Link
                    href="/dashboard"
                    className="btn btn-primary w-full mt-3"
                  >
                    Manage from dashboard
                  </Link>
                </div>
              ) : (
                <button
                  disabled={busy === "connect"}
                  onClick={connect}
                  className="btn btn-primary w-full"
                >
                  {busy === "connect" ? "Sending…" : "Request to connect"}
                </button>
              )}
              <button
                disabled={busy === "bookmark"}
                onClick={bookmark}
                className="btn btn-secondary w-full mt-2"
              >
                <Bookmark size={16} />
                {busy === "bookmark" ? "Saving…" : "Save project"}
              </button>
              <div className="flex items-center mt-6 pt-5 border-t border-white/[.07]">
                <span className="w-10 h-10 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center font-bold">
                  {p.founder?.name
                    ?.split(" ")
                    .map((x: string) => x[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "IB"}
                </span>
                <p className="ml-3 text-sm">
                  <b>{p.founder?.name || "IBF Founder"}</b>
                  <br />
                  <span className="text-xs text-slate-500">
                    {p.founder?.company || "Project founder"}
                  </span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-extrabold text-lg">{title}</h2>
      <p className="text-slate-400 leading-7 mt-3 whitespace-pre-wrap">
        {text}
      </p>
    </section>
  );
}
