"use client";
import AppShell from "@/components/AppShell";
import { Paperclip, Send, Users, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FileUploader, { type UploadedFile } from "@/components/FileUploader";
import AttachmentPreview from "@/components/AttachmentPreview";
import MessageActions from "@/components/MessageActions";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
export default function Chat() {
  const supabase = useClerkSupabaseClient();
  const [msgs, setMsgs] = useState<any[]>([]),
    [text, setText] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [me, setMe] = useState<any>(null),
    [files, setFiles] = useState<UploadedFile[]>([]),
    [replyTo, setReplyTo] = useState<any>(null),
    [showUpload, setShowUpload] = useState(false),
    bottom = useRef<HTMLDivElement>(null);
  async function load() {
    try {
      const r = await fetch("/api/chat/general", { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        setMsgs(Array.isArray(data) ? data : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);
    load();
    const timer = window.setInterval(load, 5000);
    let channel: any;
    try {
      channel = supabase
        .channel("general-messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: "room_type=eq.GENERAL",
          },
          load,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "message_reactions" },
          load,
        )
        .subscribe();
    } catch {}
    return () => {
      clearInterval(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase]);
  useEffect(() => {
    const node = bottom.current;
    if (node && typeof node.scrollIntoView === "function")
      node.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  async function react(id: string, emoji: string) {
    await fetch(`/api/messages/${id}/react`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    load();
  }
  async function modify(m: any, action: "EDIT" | "DELETE") {
    const content =
      action === "EDIT" ? window.prompt("Edit message", m.content) : undefined;
    if (action === "EDIT" && !content?.trim()) return;
    if (action === "DELETE" && !window.confirm("Delete this message?")) return;
    const r = await fetch(`/api/messages/${m.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, content }),
    });
    if (r.ok) load();
  }
  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const value = text;
    setText("");
    const r = await fetch("/api/chat/general", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: value,
        attachments: files.map((x) => x.url),
        parent_id: replyTo?.id || null,
      }),
    });
    if (r.ok) {
      setFiles([]);
      setReplyTo(null);
      setShowUpload(false);
      await load();
    } else setText(value);
    setSending(false);
  }
  return (
    <AppShell>
      <div className="h-[calc(100vh-64px)] flex">
        <section className="flex-1 flex flex-col bg-white">
          <header className="p-5 border-b border-white/[.07] flex items-center">
            <span className="w-10 h-10 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
              <Users size={20} />
            </span>
            <div className="ml-3">
              <b>IBF Community</b>
              <p className="text-xs text-emerald-600">● Live room</p>
            </div>
          </header>
          <div className="flex-1 p-5 md:p-8 overflow-auto space-y-6 bg-slate-50/60">
            {loading ? (
              <Loader2 className="animate-spin text-cyan-300 mx-auto mt-20" />
            ) : msgs.length ? (
              msgs.map((m: any) => (
                <div
                  className={`flex gap-3 max-w-2xl group ${m.parent_id ? "ml-10 border-l border-cyan-300/20 pl-3" : ""}`}
                  key={m.id}
                >
                  <span className="w-9 h-9 shrink-0 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                    {m.sender?.name?.slice(0, 2).toUpperCase() || "IB"}
                  </span>
                  <div className="min-w-0 flex-1">
                    {m.parent && (
                      <p className="text-[10px] text-slate-500 mb-1">
                        Reply to @
                        {m.parent.sender?.username || m.parent.sender?.name}:{" "}
                        {m.parent.content.slice(0, 60)}
                      </p>
                    )}
                    <div className="flex items-center">
                      <b className="text-xs">
                        {m.sender?.name || "IBF member"}
                      </b>
                      {m.sender?.username && (
                        <span className="text-cyan-300 text-[10px] ml-2">
                          @{m.sender.username}
                        </span>
                      )}
                      <time className="text-slate-500 text-[10px] ml-2">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <MessageActions
                        onReply={() => setReplyTo(m)}
                        onReact={(e) => react(m.id, e)}
                      />
                    </div>
                    <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-r-xl rounded-bl-xl text-sm leading-6">
                      {m.content}
                      <AttachmentPreview attachments={m.attachments} />
                    </div>
                    <div className="flex gap-1 mt-1">
                      {["👍", "❤️", "🔥", "👏", "🚀"].map((e) => {
                        const rows =
                          m.reactions?.filter((r: any) => r.emoji === e) || [];
                        return rows.length ? (
                          <button
                            onClick={() => react(m.id, e)}
                            className={`text-[10px] px-2 py-1 rounded-full ${rows.some((r: any) => r.user_id === me?.id) ? "bg-cyan-300/15 text-cyan-300" : "bg-white/5"}`}
                            key={e}
                          >
                            {e} {rows.length}
                          </button>
                        ) : null;
                      })}
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
            {replyTo && (
              <div className="flex items-center p-2 text-xs text-slate-400 bg-white/[.03] rounded-t-lg">
                Replying to @{replyTo.sender?.username || replyTo.sender?.name}
                <button onClick={() => setReplyTo(null)} className="ml-auto">
                  <X size={14} />
                </button>
              </div>
            )}
            {showUpload && me?.id && (
              <div className="mb-3">
                <FileUploader
                  bucket="project-files"
                  folderKey={me.id}
                  multiple
                  onUploaded={(x) => setFiles(x)}
                  label="Attach images or documents"
                />
              </div>
            )}
            <div className="flex items-center border border-slate-200 rounded-xl p-2">
              <button
                aria-label="Attach files"
                onClick={() => setShowUpload(!showUpload)}
                className="p-2 text-slate-400"
              >
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
              <button
                disabled={sending}
                onClick={send}
                className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center"
              >
                <Send size={16} />
              </button>
            </div>
            {files.length > 0 && (
              <p className="text-[10px] text-cyan-300 mt-2">
                {files.length} attachment(s) ready
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
