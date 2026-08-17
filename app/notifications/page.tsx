"use client";
import AppShell from "@/components/AppShell";
import { Bell, CheckCheck, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Notifications() {
  const [items, setItems] = useState<any[]>([]),
    [loading, setLoading] = useState(true);
  async function load() {
    const r = await fetch("/api/notifications");
    const d = await r.json();
    if (r.ok) setItems(d);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function readAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems(items.map((x) => ({ ...x, is_read: true })));
  }
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-5 md:p-8">
        <div className="flex items-end">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              ACTIVITY INBOX
            </p>
            <h1 className="text-3xl font-black mt-2">Notifications</h1>
            <p className="text-slate-500 mt-2">
              Connections, messages, matches and project updates.
            </p>
          </div>
          <button onClick={readAll} className="btn btn-secondary ml-auto">
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
        {loading ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : items.length ? (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-white/[.07]">
            {items.map((n) => (
              <Link
                href={n.link || "#"}
                key={n.id}
                className={`p-5 flex gap-4 hover:bg-white/[.025] ${!n.is_read ? "bg-cyan-300/[.025]" : ""}`}
              >
                <span className="h-10 w-10 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                  <Sparkles size={17} />
                </span>
                <div>
                  <b className="text-sm text-white">
                    {n.type.replaceAll("_", " ")}
                  </b>
                  <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.is_read && (
                  <i className="ml-auto mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <Bell className="mx-auto text-slate-600" size={38} />
            <h2 className="font-bold mt-4">You’re all caught up</h2>
            <p className="text-sm text-slate-500 mt-2">
              New collaboration activity will appear here.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
