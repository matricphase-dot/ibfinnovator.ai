"use client";

import AppShell from "@/components/AppShell";
import { Inbox, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Inquiry inbox (received) and outbox (sent).
 *
 * Only the provider can move a status, which is why the action buttons render
 * on the received side only; the API returns 403 for anyone else regardless.
 */

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-cyan-300/15 text-cyan-300",
  CONTACTED: "bg-amber-300/15 text-amber-200",
  CLOSED: "bg-white/5 text-slate-400",
};

export default function MarketplaceInquiries() {
  const [data, setData] = useState<{ received: any[]; sent: any[] }>({
    received: [],
    sent: [],
  });
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/marketplace/inquiries", { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      setData({ received: payload.received ?? [], sent: payload.sent ?? [] });
    } else if (response.status === 401) {
      setError("Sign in to see your inquiries.");
    } else {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Could not load your inquiries.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "CONTACTED" | "CLOSED") {
    setBusy(id);
    try {
      const response = await fetch("/api/marketplace/inquiries", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success(status === "CLOSED" ? "Inquiry closed" : "Marked as contacted");
        void load();
      } else {
        toast.error(payload.error || "Could not update this inquiry");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setBusy("");
    }
  }

  const rows = tab === "received" ? data.received : data.sent;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          SERVICE INQUIRIES
        </p>
        <h1 className="text-3xl font-black mt-2">Inquiries</h1>
        <p className="text-slate-500 mt-2">
          Requests members sent about your listings, and the ones you sent.
        </p>

        <div className="flex gap-2 mt-7">
          {(["received", "sent"] as const).map((key) => (
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
              {key === "received"
                ? `Received${data.received.length ? ` (${data.received.length})` : ""}`
                : `Sent${data.sent.length ? ` (${data.sent.length})` : ""}`}
            </button>
          ))}
          <Link href="/marketplace" className="ml-auto text-xs text-cyan-300 self-center">
            Back to marketplace
          </Link>
        </div>

        {error && <p className="mt-8 text-sm text-rose-300">{error}</p>}

        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-24" />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            {tab === "received" ? (
              <Inbox className="mx-auto text-slate-600" size={40} />
            ) : (
              <Send className="mx-auto text-slate-600" size={40} />
            )}
            <h2 className="font-bold mt-4">
              {tab === "received" ? "No inquiries yet" : "You have not sent an inquiry"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {tab === "received"
                ? "When a member contacts you about a listing it lands here."
                : "Find a service in the marketplace and contact the provider."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            {rows.map((row) => {
              const counterparty = tab === "received" ? row.sender : row.provider;
              return (
                <article className="bg-white border border-slate-200 rounded-2xl p-5" key={row.id}>
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                      {counterparty?.name?.slice(0, 2).toUpperCase() || "IB"}
                    </span>
                    <div className="min-w-0">
                      <b className="text-sm">{counterparty?.name || "IBF member"}</b>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tab === "received" ? "about" : "regarding"}{" "}
                        <span className="text-cyan-300">{row.service?.title || "a listing"}</span>
                        {" · "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`pill ml-auto ${
                        STATUS_STYLES[row.status] ?? "bg-white/5 text-slate-400"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 leading-6 mt-4 whitespace-pre-wrap">
                    {row.message}
                  </p>

                  {tab === "received" && (
                    <div className="flex gap-2 mt-5">
                      <button
                        type="button"
                        disabled={busy === row.id || row.status === "CONTACTED"}
                        onClick={() => void setStatus(row.id, "CONTACTED")}
                        className="btn btn-secondary !py-2 text-xs disabled:opacity-50"
                      >
                        Mark contacted
                      </button>
                      <button
                        type="button"
                        disabled={busy === row.id || row.status === "CLOSED"}
                        onClick={() => void setStatus(row.id, "CLOSED")}
                        className="btn btn-secondary !py-2 text-xs disabled:opacity-50"
                      >
                        Close inquiry
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
