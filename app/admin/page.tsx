"use client";
import AppShell from "@/components/AppShell";
import {
  AlertTriangle,
  FolderKanban,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function Admin() {
  const [d, setD] = useState<any>(null),
    [error, setError] = useState("");
  async function load() {
    const r = await fetch("/api/admin"),
      x = await r.json();
    r.ok ? setD(x) : setError(x.error);
  }
  useEffect(() => {
    load();
  }, []);
  async function patch(body: any) {
    const r = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    r.ok ? (toast.success("Updated"), load()) : toast.error("Update failed");
  }
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          SUPER ADMIN
        </p>
        <h1 className="text-3xl font-black mt-2">Platform control center</h1>
        {error ? (
          <div className="mt-10 text-red-300">{error}</div>
        ) : !d ? (
          <Loader2 className="animate-spin text-cyan-300 mt-20 mx-auto" />
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                [Users, "Users", d.stats.users],
                [FolderKanban, "Projects", d.stats.projects],
                [AlertTriangle, "Open reports", d.stats.openReports],
              ].map(([I, l, v]: any) => (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <I className="text-cyan-300" />
                  <p className="text-xs text-slate-500 mt-4">{l}</p>
                  <b className="text-3xl">{v}</b>
                </div>
              ))}
            </div>
            <h2 className="font-bold text-lg mt-9">User moderation</h2>
            <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-white/10">
                    <th className="p-4">User</th>
                    <th>Role</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {d.users.map((u: any) => (
                    <tr className="border-b border-white/[.05]" key={u.id}>
                      <td className="p-4">
                        <b>{u.name}</b>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td>{u.role}</td>
                      <td>{u.verification_status || "UNVERIFIED"}</td>
                      <td>{u.suspended ? "Suspended" : "Active"}</td>
                      <td>
                        <button
                          onClick={() =>
                            patch({
                              type: "USER",
                              id: u.id,
                              suspended: !u.suspended,
                            })
                          }
                          className="btn btn-secondary !py-2 text-xs"
                        >
                          {u.suspended ? "Restore" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="font-bold text-lg mt-9">Safety reports</h2>
            <div className="space-y-3 mt-3">
              {d.reports.length ? (
                d.reports.map((r: any) => (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center">
                    <ShieldCheck className="text-cyan-300" />
                    <div className="ml-3">
                      <b className="text-sm">{r.reason}</b>
                      <p className="text-xs text-slate-500">
                        Reported by {r.reporter?.name}
                      </p>
                    </div>
                    <select
                      value={r.status}
                      onChange={(e) =>
                        patch({
                          type: "REPORT",
                          id: r.id,
                          status: e.target.value,
                        })
                      }
                      className="field !w-auto ml-auto"
                    >
                      <option>OPEN</option>
                      <option>REVIEWING</option>
                      <option>RESOLVED</option>
                      <option>DISMISSED</option>
                    </select>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No reports.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
