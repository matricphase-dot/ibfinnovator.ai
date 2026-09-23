"use client";
import AppShell from "@/components/AppShell";
import { ArrowLeft, Loader2, Paperclip, Send, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FileUploader, { type UploadedFile } from "@/components/FileUploader";
import AttachmentPreview from "@/components/AttachmentPreview";
import MessageActions from "@/components/MessageActions";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
export default function DirectChat() {
  const supabase = useClerkSupabaseClient(),
    { projectId } = useParams<{ projectId: string }>(),
    [msgs, setMsgs] = useState<any[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [me, setMe] = useState<any>(null),
    [files, setFiles] = useState<UploadedFile[]>([]),
    [replyTo, setReplyTo] = useState<any>(null),
    [showUpload, setShowUpload] = useState(false),
    [typing, setTyping] = useState(""),
    bottom = useRef<HTMLDivElement>(null),
    channelRef = useRef<any>(null),
    typingTimer = useRef<any>(null);
  const loadSeq = useRef(0);
  const loadAbort = useRef<AbortController | null>(null);
  async function load() {
    const seq = ++loadSeq.current;
    loadAbort.current?.abort();
    const ctrl = new AbortController();
    loadAbort.current = ctrl;
    try {
      const r = await fetch(`/api/chat/direct/${projectId}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      const d = await r.json().catch(() => ({}));
      if (seq !== loadSeq.current) return;
      if (r.ok) {
        setMsgs(Array.isArray(d.messages) ? d.messages : []);
        setError("");
      } else if (r.status === 401) {
        window.location.assign(`/auth/signin?next=/chat/direct/${projectId}`);
        return;
      } else setError(typeof d?.error === "string" ? d.error : "Unable to load chat");
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (seq === loadSeq.current) setError("Unable to reach the chat service.");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);
    load();
    // ROOT FIX: realtime primary, 30s visible-only revalidate (was 5s double-fire).
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    let channel: any;
    let debounced: ReturnType<typeof setTimeout> | undefined;
    const scheduleLoad = () => {
      clearTimeout(debounced);
      debounced = setTimeout(load, 300);
    };
    try {
      channel = supabase
        .channel(`direct-${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `project_id=eq.${projectId}`,
          },
          scheduleLoad,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "message_reactions" },
          scheduleLoad,
        )
        .on("broadcast", { event: "typing" }, ({ payload }: any) => {
          if (payload.profileId !== me?.id) {
            setTyping(payload.name || "Someone");
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTyping(""), 1800);
          }
        })
        .subscribe();
      channelRef.current = channel;
    } catch {
      // Realtime unavailable: interval remains as fallback.
    }
    return () => {
      clearInterval(timer);
      clearTimeout(debounced);
      clearTimeout(typingTimer.current);
      loadAbort.current?.abort();
      if (channel) void supabase.removeChannel(channel).catch(() => {});
    };
  }, [projectId, supabase, me?.id, me?.name]);
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
    if (!text.trim()) return;
    const value = text;
    setText("");
    const r = await fetch(`/api/chat/direct/${projectId}`, {
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
      load();
    } else {
      const d = await r.json();
      setError(d.error);
      setText(value);
    }
  }
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === me?.id);
  return (
    <AppShell>
      <div className="h-[calc(100vh-64px)] max-w-5xl mx-auto flex flex-col bg-white border-x border-white/[.07]">
        <header className="p-4 border-b border-white/[.07] flex items-center">
          <Link href="/dashboard" className="p-2 text-slate-400">
            <ArrowLeft />
          </Link>
          <div className="ml-2">
            <b>Project conversation</b>
            <p className="text-xs text-slate-500">
              {typing ? `${typing} is typing…` : "Accepted collaborators only"}
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {loading ? (
            <Loader2 className="animate-spin text-cyan-300 mx-auto mt-20" />
          ) : error ? (
            <div className="text-center mt-20">
              <p className="text-red-300">{error}</p>
            </div>
          ) : (
            msgs.map((m) => (
              <div
                className={`flex gap-3 group ${m.parent_id ? "ml-10 border-l border-cyan-300/20 pl-3" : ""}`}
                key={m.id}
              >
                <span className="h-9 w-9 shrink-0 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                  {m.sender?.name?.slice(0, 2).toUpperCase() || "IB"}
                </span>
                <div className="min-w-0 flex-1">
                  {m.parent && (
                    <p className="text-[10px] text-slate-500">
                      Reply to @
                      {m.parent.sender?.username || m.parent.sender?.name}:{" "}
                      {String(m.parent?.content ?? "").slice(0, 60)}
                    </p>
                  )}
                  <div className="flex items-center">
                    <b className="text-xs">{m.sender?.name}</b>
                    {m.sender?.username && (
                      <span className="text-[10px] text-cyan-300 ml-2">
                        @{m.sender.username}
                      </span>
                    )}
                    <MessageActions
                      onReply={() => setReplyTo(m)}
                      onReact={(e) => react(m.id, e)}
                    />
                  </div>
                  <div className="mt-1 p-3 rounded-r-xl rounded-bl-xl border border-white/[.08] bg-white/[.025] text-sm">
                    {m.content}
                    <AttachmentPreview attachments={m.attachments} />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {["👍", "❤️", "🔥", "👏", "🚀"].map((e) => {
                      const rs =
                        m.reactions?.filter((r: any) => r.emoji === e) || [];
                      return rs.length ? (
                        <button
                          onClick={() => react(m.id, e)}
                          className={`text-[10px] px-2 py-1 rounded-full ${rs.some((r: any) => r.user_id === me?.id) ? "bg-cyan-300/15 text-cyan-300" : "bg-white/5"}`}
                          key={e}
                        >
                          {e} {rs.length}
                        </button>
                      ) : null;
                    })}
                    {lastMine?.id === m.id && (
                      <span className="text-[9px] text-slate-500 ml-2">
                        {m.read_at ? "Read" : "Sent"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottom} />
        </div>
        {!error && (
          <div className="p-4 border-t border-white/[.07]">
            {replyTo && (
              <div className="flex text-xs p-2 bg-white/[.03]">
                Replying to @{replyTo.sender?.username || replyTo.sender?.name}
                <button className="ml-auto" onClick={() => setReplyTo(null)}>
                  <X size={14} />
                </button>
              </div>
            )}
            {showUpload && me?.id && (
              <FileUploader
                bucket="project-files"
                folderKey={me.id}
                multiple
                onUploaded={setFiles}
                label="Attach files"
              />
            )}
            <div className="flex gap-2 mt-2">
              <button
                aria-label="Attach files"
                onClick={() => setShowUpload(!showUpload)}
                className="btn btn-secondary !px-3"
              >
                <Paperclip size={16} />
              </button>
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  void channelRef.current?.send({
                    type: "broadcast",
                    event: "typing",
                    payload: { profileId: me?.id, name: me?.name },
                  });
                }}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="field"
                placeholder="Write a message…"
              />
              <button onClick={send} className="btn btn-primary">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
