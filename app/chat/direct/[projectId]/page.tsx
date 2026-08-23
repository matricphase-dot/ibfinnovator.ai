"use client";
import AppShell from "@/components/AppShell";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
export default function DirectChat() {
  const { projectId } = useParams<{ projectId: string }>(),
    [msgs, setMsgs] = useState<any[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    bottom = useRef<HTMLDivElement>(null);
  async function load() {
    try {
      const r = await fetch(`/api/chat/direct/${projectId}`, {
          cache: "no-store",
        }),
        d = await r.json();
      if (r.ok) setMsgs(Array.isArray(d.messages) ? d.messages : []);
      else setError(d.error || "Unable to load chat");
    } catch {
      setError("Unable to reach the chat service.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [projectId]);
  useEffect(() => {
    const node = bottom.current;
    if (node && typeof node.scrollIntoView === "function")
      node.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  async function send() {
    if (!text.trim()) return;
    const value = text;
    setText("");
    const r = await fetch(`/api/chat/direct/${projectId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
    if (r.ok) {
      const m = await r.json();
      setMsgs((x) => [...x, m]);
    } else {
      const d = await r.json();
      setError(d.error);
      setText(value);
    }
  }
  return (
    <AppShell>
      <div className="h-[calc(100vh-64px)] max-w-5xl mx-auto flex flex-col bg-white border-x border-white/[.07]">
        <div className="p-4 border-b border-white/[.07] flex items-center">
          <Link href="/dashboard" className="p-2 text-slate-400">
            <ArrowLeft />
          </Link>
          <div className="ml-2">
            <b>Project conversation</b>
            <p className="text-xs text-slate-500">
              Accepted collaborators only
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {loading ? (
            <Loader2 className="animate-spin text-cyan-300 mx-auto mt-20" />
          ) : error ? (
            <div className="text-center mt-20">
              <p className="text-red-300">{error}</p>
              <Link href="/dashboard" className="btn btn-secondary mt-4">
                Back to dashboard
              </Link>
            </div>
          ) : (
            msgs.map((m) => (
              <div className="flex gap-3" key={m.id}>
                <span className="h-9 w-9 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                  {m.sender?.name?.slice(0, 2).toUpperCase() || "IB"}
                </span>
                <div>
                  <b className="text-xs">{m.sender?.name}</b>
                  <p className="mt-1 p-3 rounded-r-xl rounded-bl-xl border border-white/[.08] bg-white/[.025] text-sm">
                    {m.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottom} />
        </div>
        {!error && (
          <div className="p-4 border-t border-white/[.07] flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="field"
              placeholder="Write a message…"
            />
            <button onClick={send} className="btn btn-primary">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
