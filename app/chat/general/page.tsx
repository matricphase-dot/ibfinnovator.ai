"use client";
import AppShell from "@/components/AppShell";
import { Paperclip, Send, Smile, Users, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export default function Chat() {
  const [msgs, setMsgs] = useState<any[]>([]),
    [text, setText] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    bottom = useRef<HTMLDivElement>(null);
  async function load() {
    const r = await fetch("/api/chat/general", { cache: "no-store" });
    if (r.ok) setMsgs(await r.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
    const timer=window.setInterval(load,4000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(
    () => bottom.current?.scrollIntoView({ behavior: "smooth" }),
    [msgs],
  );
  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const value = text;
    setText("");
    const r = await fetch("/api/chat/general", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
    if (r.ok) {
      const m = await r.json();
      setMsgs((x) => (x.some((y) => y.id === m.id) ? x : [...x, m]));
    } else setText(value);
    setSending(false);
  }
  return (
    <AppShell>
      <div className="h-[calc(100vh-64px)] flex">
        <section className="flex-1 flex flex-col bg-white">
          <div className="p-5 border-b border-white/[.07] flex items-center">
            <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 grid place-items-center">
              <Users size={20} />
            </span>
            <div className="ml-3">
              <b>IBF Community</b>
              <p className="text-xs text-emerald-600">● Live room</p>
            </div>
          </div>
          <div className="flex-1 p-5 md:p-8 overflow-auto space-y-6 bg-slate-50/60">
            {loading ? (
              <Loader2 className="animate-spin text-cyan-300 mx-auto mt-20" />
            ) : msgs.length ? (
              msgs.map((m: any) => (
                <div className="flex gap-3 max-w-2xl" key={m.id}>
                  <span className="w-9 h-9 shrink-0 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                    {m.sender?.name?.slice(0, 2).toUpperCase() || "IB"}
                  </span>
                  <div>
                    <p className="text-xs">
                      <b>{m.sender?.name || "IBF member"}</b>
                      <time className="text-slate-500 ml-2">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </p>
                    <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-r-xl rounded-bl-xl text-sm leading-6">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 mt-20">
                Start the first community conversation.
              </p>
            )}
            <div ref={bottom} />
          </div>
          <div className="p-4 border-t border-white/[.07]">
            <div className="flex items-center border border-slate-200 rounded-xl p-2">
              <button className="p-2 text-slate-400">
                <Paperclip size={19} />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="flex-1 px-2 outline-none text-sm bg-transparent"
                placeholder="Message the community…"
              />
              <button className="p-2 text-slate-400">
                <Smile size={19} />
              </button>
              <button
                disabled={sending}
                onClick={send}
                className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
        <aside className="hidden xl:block w-72 border-l border-white/[.07] bg-white p-5">
          <b className="text-sm">Community guidelines</b>
          <p className="text-xs text-slate-500 leading-5 mt-3">
            Be generous with context. Keep feedback constructive. Never share
            secrets, passwords or private customer data.
          </p>
          <h3 className="text-xs font-black tracking-widest text-slate-500 mt-8">
            CHANNEL PURPOSE
          </h3>
          <p className="text-sm text-slate-400 mt-4">
            Introductions, collaboration requests, product feedback and
            ecosystem questions.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
