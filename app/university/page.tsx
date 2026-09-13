"use client";
import AppShell from "@/components/AppShell";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
export default function University() {
  const [d, setD] = useState<any>(null);
  async function load() {
    setD(await fetch("/api/university").then((r) => r.json()));
  }
  useEffect(() => {
    load();
  }, []);
  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/university", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ university_id: f.get("university_id") }),
      }),
      x = await r.json();
    if (r.ok) {
      toast.success("University linked");
      load();
    } else toast.error(x.error);
  }
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          UNIVERSITY PARTNER PORTAL
        </p>
        <div className="flex items-center">
          <h1 className="text-3xl font-black mt-2">Campus opportunities</h1>
          {d?.role === "SUPER_ADMIN" && (
            <Link
              href="/university/admin"
              className="btn btn-secondary ml-auto"
            >
              University Admin
            </Link>
          )}
        </div>
        {!d ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-24" />
        ) : !d.membership ? (
          <div className="max-w-xl mx-auto py-20 text-center">
            <GraduationCap className="mx-auto text-cyan-300" size={44} />
            <h2 className="font-bold mt-4">Link your university</h2>
            <p className="text-sm text-slate-500 mt-2">
              Your signed-in email must match the institution's verified domain.
            </p>
            <form onSubmit={join} className="mt-6">
              <select required name="university_id" className="field">
                <option value="">Select university</option>
                {d.universities?.map((u: any) => (
                  <option value={u.id} key={u.id}>
                    {u.name} · {u.domain}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary w-full mt-3">
                Verify and join
              </button>
            </form>
          </div>
        ) : (
          <>
            <p className="text-slate-500 mt-2">
              {d.membership.university.name} · {d.students.length} verified
              members
            </p>
            <h2 className="font-bold mt-8">Verified students</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {d.students.map((x: any) => (
                <a
                  href={`/profile/${x.user_id}`}
                  className="project-cyber-card"
                  key={x.user_id}
                >
                  <b>{x.profile?.name}</b>
                  <p className="text-xs text-cyan-300">
                    @{x.profile?.username}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {x.profile?.skills?.slice(0, 3).map((s: string) => (
                      <span className="tech-chip" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
            <h2 className="font-bold mt-9">Open projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              {d.projects.map((p: any) => (
                <a
                  href={`/projects/${p.id}`}
                  className="project-cyber-card"
                  key={p.id}
                >
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    {p.domain} · {p.stage}
                  </p>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
