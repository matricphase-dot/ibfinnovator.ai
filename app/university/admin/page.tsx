"use client";

import AppShell from "@/components/AppShell";
import {
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * University partner keys — reachable only by SUPER_ADMIN.
 *
 * The page holds no access rules of its own: /api/university/admin decides who
 * may read or change anything, and a non-admin simply gets a 403 panel here.
 * This is a scoped partner tool, not a general admin console, so it is not
 * linked from the member navigation.
 */

type University = {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  created_at: string;
  members: number;
  api_key_masked: string | null;
  has_key: boolean;
};

export default function UniversityAdmin() {
  const [rows, setRows] = useState<University[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "signedout" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/university/admin", { cache: "no-store" });
    if (response.status === 403) {
      setState("denied");
      return;
    }
    if (response.status === 401) {
      setState("signedout");
      return;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Could not load universities.");
      setState("error");
      return;
    }
    setRows(await response.json());
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/university/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), domain: domain.trim() }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success(`${payload.name} added`);
        setName("");
        setDomain("");
        void load();
      } else {
        toast.error(payload.error || "Could not add this university");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setCreating(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setBusy(id);
    try {
      const response = await fetch("/api/university/admin", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success(message);
        setRevealed((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (payload.api_key) setRevealed({ [id]: payload.api_key });
        void load();
      } else {
        toast.error(payload.error || "Could not update this university");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setBusy("");
    }
  }

  async function reveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const response = await fetch(`/api/university/admin?reveal=${id}`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setRevealed((prev) => ({ ...prev, [id]: payload.api_key }));
    else toast.error(payload.error || "Could not reveal this key");
  }

  async function copy(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("Key copied");
    } catch {
      toast.error("Copy failed — select the key manually");
    }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          UNIVERSITY PARTNER KEYS
        </p>
        <h1 className="text-3xl font-black mt-2">Partner API access</h1>
        <p className="text-slate-500 mt-2">
          Each university uses its key as the <code>x-api-key</code> header on
          {" "}<code>/api/university/public/students</code> and{" "}
          <code>/api/university/public/projects</code>.
        </p>

        {state === "loading" && (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-24" />
        )}

        {state === "signedout" && (
          <div className="py-16 text-center">
            <ShieldAlert className="mx-auto text-slate-600" size={40} />
            <h2 className="font-bold mt-4">Sign in required</h2>
            <Link href="/auth/signin" className="btn btn-primary mt-6 text-xs">
              Sign in
            </Link>
          </div>
        )}

        {state === "denied" && (
          <div className="py-16 text-center">
            <ShieldAlert className="mx-auto text-rose-400" size={40} />
            <h2 className="font-bold mt-4">SUPER_ADMIN access required</h2>
            <p className="text-sm text-slate-500 mt-2">
              This page manages partner keys for the platform team only.
            </p>
            <Link href="/university" className="btn btn-secondary mt-6 text-xs">
              Back to campus portal
            </Link>
          </div>
        )}

        {state === "error" && <p className="mt-8 text-sm text-rose-300">{error}</p>}

        {state === "ready" && (
          <>
            <form
              onSubmit={create}
              className="bg-white border border-slate-200 rounded-2xl p-5 mt-8"
            >
              <b className="text-sm">Add a university</b>
              <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-4">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field"
                  placeholder="Institution name"
                  required
                  minLength={2}
                />
                <input
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  className="field"
                  placeholder="students.example.edu"
                  required
                  minLength={3}
                />
                <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-60">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={15} />}
                  Add
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                A key is generated automatically. Members verify with an email on this domain.
              </p>
            </form>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] tracking-widest text-slate-500">
                    <th className="py-3 pr-4">UNIVERSITY</th>
                    <th className="py-3 pr-4">MEMBERS</th>
                    <th className="py-3 pr-4">API KEY</th>
                    <th className="py-3 pr-4">STATUS</th>
                    <th className="py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No universities yet. Add the first partner above.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 align-middle">
                      <td className="py-4 pr-4">
                        <span className="flex items-center gap-2">
                          <Building2 size={15} className="text-cyan-300" />
                          <span>
                            <b className="block">{row.name}</b>
                            <span className="text-xs text-slate-500">{row.domain}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-400">{row.members}</td>
                      <td className="py-4 pr-4">
                        {revealed[row.id] ? (
                          <span className="flex items-center gap-2">
                            <code className="text-xs text-cyan-300">{revealed[row.id]}</code>
                            <button
                              type="button"
                              onClick={() => void copy(revealed[row.id])}
                              aria-label="Copy API key"
                              className="text-slate-400 hover:text-cyan-300"
                            >
                              <Copy size={13} />
                            </button>
                          </span>
                        ) : (
                          <code className="text-xs text-slate-400">
                            {row.api_key_masked || "no key"}
                          </code>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() =>
                            void patch(
                              row.id,
                              { active: !row.active },
                              row.active ? "Partner disabled" : "Partner enabled",
                            )
                          }
                          className={`pill border disabled:opacity-50 ${
                            row.active
                              ? "bg-cyan-300/15 text-cyan-300 border-cyan-300/30"
                              : "bg-white/5 text-slate-400 border-white/10"
                          }`}
                        >
                          {row.active ? <Check size={12} /> : null}
                          {row.active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void reveal(row.id)}
                            className="btn btn-secondary !py-1.5 text-[11px]"
                          >
                            {revealed[row.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            {revealed[row.id] ? "Hide" : "Reveal"}
                          </button>
                          <button
                            type="button"
                            disabled={busy === row.id}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Generate a new key? The current key stops working immediately.",
                                )
                              ) {
                                void patch(row.id, { regenerate: true }, "New key generated");
                              }
                            }}
                            className="btn btn-secondary !py-1.5 text-[11px] disabled:opacity-50"
                          >
                            <RefreshCw size={12} />
                            Regenerate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
