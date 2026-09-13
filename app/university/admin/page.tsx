"use client";
import AppShell from "@/components/AppShell";
import { Eye, EyeOff, KeyRound, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function UniversityAdmin() {
  const [items, setItems] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reveal, setReveal] = useState<string | null>(null);
  async function load() {
    const r = await fetch("/api/university/admin"),
      d = await r.json();
    r.ok ? setItems(d) : setError(d.error);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/university/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), domain: f.get("domain") }),
      });
    if (r.ok) {
      toast.success("University added");
      e.currentTarget.reset();
      load();
    } else toast.error("Could not add university");
  }
  async function patch(body: any) {
    const r = await fetch("/api/university/admin", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) load();
  }
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          RESTRICTED PARTNER OPERATIONS
        </p>
        <h1 className="text-3xl font-black mt-2">University management</h1>
        {error ? (
          <p className="text-red-300 mt-8">{error}</p>
        ) : loading ? (
          <Loader2 className="animate-spin mx-auto mt-24" />
        ) : (
          <>
            <form
              onSubmit={create}
              className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-8 bg-white border border-slate-200 rounded-2xl p-4"
            >
              <input
                required
                name="name"
                className="field"
                placeholder="University name"
              />
              <input
                required
                name="domain"
                className="field"
                placeholder="university.edu"
              />
              <button className="btn btn-primary">
                <Plus size={15} />
                Add
              </button>
            </form>
            <div className="space-y-3 mt-6">
              {items.map((u) => (
                <div
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3"
                  key={u.id}
                >
                  <div>
                    <b>{u.name}</b>
                    <p className="text-xs text-slate-500">{u.domain}</p>
                  </div>
                  <code className="ml-auto text-xs text-cyan-300">
                    {reveal === u.id
                      ? u.api_key
                      : `••••••••-${u.api_key?.slice(-6) || "unset"}`}
                  </code>
                  <button
                    onClick={() => setReveal(reveal === u.id ? null : u.id)}
                    className="btn btn-secondary !px-3"
                  >
                    {reveal === u.id ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => patch({ id: u.id, regenerate_key: true })}
                    className="btn btn-secondary !px-3"
                  >
                    <KeyRound size={14} />
                  </button>
                  <button
                    onClick={() => patch({ id: u.id, active: !u.active })}
                    className="btn btn-secondary"
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
