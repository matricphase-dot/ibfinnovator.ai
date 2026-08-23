"use client";
import AppShell from "@/components/AppShell";
import { Check, FileText, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function Applications() {
  const [items, setItems] = useState<any[]>([]),
    [me, setMe] = useState<any>(null),
    [loading, setLoading] = useState(true);
  async function load() {
    const [a, p] = await Promise.all([
      fetch("/api/applications").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
    ]);
    setItems(a);
    setMe(p);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function respond(id: string, status: "ACCEPTED" | "REJECTED") {
    const r = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    r.ok
      ? (toast.success(`Application ${status.toLowerCase()}`), load())
      : toast.error("Could not update application");
  }
  const founder = me?.role === "FOUNDER" || me?.role === "SUPER_ADMIN";
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          {founder ? "FOUNDER PIPELINE" : "YOUR OPPORTUNITIES"}
        </p>
        <h1 className="text-3xl font-black mt-2">Applications</h1>
        <p className="text-slate-500 mt-2">
          {founder
            ? "Review real applicants across your open projects."
            : "Track the status of projects you have applied to."}
        </p>
        {loading ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : items.length ? (
          <div className="space-y-4 mt-8">
            {items.map((a) => (
              <article
                className="bg-white border border-slate-200 rounded-2xl p-5"
                key={a.id}
              >
                <div className="flex items-start">
                  <span className="h-11 w-11 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                    <FileText />
                  </span>
                  <div className="ml-4">
                    <h2 className="font-bold text-white">{a.project?.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {founder
                        ? `Applicant: ${a.student?.name}`
                        : `Submitted ${new Date(a.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={`pill ml-auto ${a.status === "ACCEPTED" ? "bg-cyan-300/10 text-cyan-300" : a.status === "REJECTED" ? "bg-red-400/10 text-red-300" : "bg-amber-300/10 text-amber-300"}`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-6 mt-5 whitespace-pre-wrap">
                  {a.cover_letter}
                </p>
                {founder && a.student?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {a.student.skills.map((s: string) => (
                      <span className="tech-chip" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex mt-5 pt-4 border-t border-white/[.07]">
                  <Link
                    href={`/projects/${a.project_id}`}
                    className="text-xs font-bold text-cyan-300"
                  >
                    View project
                  </Link>
                  {founder && a.status === "PENDING" && (
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => respond(a.id, "REJECTED")}
                        className="btn btn-secondary !py-2 text-xs"
                      >
                        <X size={14} />
                        Decline
                      </button>
                      <button
                        onClick={() => respond(a.id, "ACCEPTED")}
                        className="btn btn-primary !py-2 text-xs"
                      >
                        <Check size={14} />
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <FileText className="mx-auto text-slate-600" size={40} />
            <h2 className="font-bold mt-4">No applications yet</h2>
            <p className="text-sm text-slate-500 mt-2">
              {founder
                ? "Applications will appear when students express interest."
                : "Explore matched projects and submit a thoughtful application."}
            </p>
            <Link
              href={founder ? "/projects" : "/matches"}
              className="btn btn-primary mt-5"
            >
              {founder ? "View projects" : "Find opportunities"}
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
