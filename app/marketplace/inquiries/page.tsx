"use client";
import AppShell from "@/components/AppShell";
import { Inbox, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
export default function Inquiries() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/api/marketplace/inquiries")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(setD);
  }, []);
  if (!d)
    return (
      <AppShell>
        <Loader2 className="animate-spin text-cyan-300 mx-auto mt-32" />
      </AppShell>
    );
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          MARKETPLACE INBOX
        </p>
        <h1 className="text-3xl font-black mt-2">Service inquiries</h1>
        <div className="space-y-4 mt-8">
          {d.items.length ? (
            d.items.map((x: any) => (
              <article
                className="bg-white border border-slate-200 rounded-2xl p-5"
                key={x.id}
              >
                <div className="flex">
                  <div>
                    <b>{x.service?.title}</b>
                    <p className="text-xs text-slate-500 mt-1">
                      {x.from_user_id === d.profileId
                        ? "Sent inquiry"
                        : `From ${x.sender?.name}`}
                    </p>
                  </div>
                  <span className="pill bg-cyan-300/10 text-cyan-300 ml-auto">
                    {x.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-4 whitespace-pre-wrap">
                  {x.message}
                </p>
                <time className="block text-[10px] text-slate-600 mt-3">
                  {new Date(x.created_at).toLocaleString()}
                </time>
              </article>
            ))
          ) : (
            <div className="py-20 text-center">
              <Inbox className="mx-auto text-slate-600" />
              <p className="text-slate-500 mt-3">No service inquiries yet.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
