"use client";

import { Loader2, Paperclip, Send, X } from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AttachmentPreview from "@/components/AttachmentPreview";
import FileUploader from "@/components/FileUploader";
import MessageActions from "@/components/MessageActions";
import { ALLOWED_REACTIONS, formatBytes } from "@/lib/messages";
import { getRealtimeClient } from "@/lib/realtime";
import type { MessageAttachment } from "@/lib/messages";
import type { UploadedFile } from "@/lib/upload";

/**
 * Shared chat surface for the community room and direct project messages.
 *
 * Live updates arrive over a Supabase Realtime channel (message INSERT/UPDATE,
 * reaction INSERT/DELETE, and presence for typing indicators). Realtime is
 * best-effort: if the client is unavailable, the channel errors, or the
 * subscriber is not allowed to see the rows, a 5 second poll keeps the room
 * working. Nothing here throws on a Realtime disconnect.
 */

const POLL_MS = 5000;
const TYPING_IDLE_MS = 2500;

export interface ChatRoomProps {
  mode: "GENERAL" | "DIRECT";
  projectId?: string;
  title: string;
  subtitle?: string;
  headerIcon?: ReactNode;
  aside?: ReactNode;
  emptyText?: string;
  backHref?: string;
}

interface Msg {
  id: string;
  sender_id: string;
  recipient_id?: string | null;
  content: string;
  attachments?: MessageAttachment[] | null;
  parent_id?: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  read_at?: string | null;
  sender?: { id: string; name?: string | null; avatar_url?: string | null } | null;
}

const initialsOf = (name?: string | null) =>
  name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IB";

export default function ChatRoom({
  mode,
  projectId,
  title,
  subtitle,
  headerIcon,
  aside,
  emptyText = "Start the first conversation.",
  backHref = "/dashboard",
}: ChatRoomProps) {
  const [me, setMe] = useState<{ id: string; name?: string } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [mine, setMine] = useState<Record<string, string[]>>({});
  const [text, setText] = useState("");
  const [pending, setPending] = useState<UploadedFile[]>([]);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const bottom = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const reloadTimer = useRef<number | null>(null);
  const typingSentAt = useRef(0);
  const idleTimer = useRef<number | null>(null);
  const stopped = useRef(false);

  const listUrl = mode === "GENERAL" ? "/api/chat/general" : `/api/chat/direct/${projectId}`;

  // ---------------------------------------------------------------- identity
  useEffect(() => {
    let alive = true;
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.id) setMe({ id: data.id, name: data.name });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // -------------------------------------------------------------- reactions
  const loadReactions = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      try {
        const response = await fetch(
          `/api/messages/reactions?ids=${encodeURIComponent(ids.join(","))}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = await response.json();
        setCounts(data?.reactions ?? {});
        setMine(data?.mine ?? {});
      } catch {
        // keep whatever we already show
      }
    },
    [],
  );

  // ------------------------------------------------------------------ load
  const load = useCallback(async () => {
    try {
      const response = await fetch(listUrl, { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        const denied = await response.json().catch(() => null);
        if (!stopped.current) {
          setAccessError(denied?.error || "You do not have access to this conversation.");
          setLoading(false);
        }
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const list: Msg[] = Array.isArray(data) ? data : (data?.messages ?? []);
      if (stopped.current) return;
      setMsgs(list);
      void loadReactions(list.map((m) => m.id));
    } catch {
      // transient failures are expected; the poll retries
    } finally {
      if (!stopped.current) setLoading(false);
    }
  }, [listUrl, loadReactions]);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => void load(), 400);
  }, [load]);

  // -------------------------------------------------- polling + initial load
  useEffect(() => {
    stopped.current = false;
    void load();
    const timer = window.setInterval(() => {
      if (!accessError) void load();
    }, POLL_MS);
    return () => {
      stopped.current = true;
      window.clearInterval(timer);
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [load, accessError]);

  // --------------------------------------------------------------- realtime
  useEffect(() => {
    const client = getRealtimeClient();
    if (!client) return; // no public Supabase env: polling only

    const topic = mode === "GENERAL" ? "chat-general" : `chat-direct-${projectId}`;
    const filter =
      mode === "GENERAL" ? "room_type=eq.GENERAL" : `project_id=eq.${projectId}`;

    let channel: any;
    try {
      channel = client.channel(topic, {
        config: { presence: { key: me?.id ?? "anonymous" } },
      });
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter },
          () => scheduleReload(),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter },
          () => scheduleReload(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "message_reactions" },
          () => scheduleReload(),
        )
        .on("presence", { event: "sync" }, () => {
          try {
            const state = channel.presenceState?.() ?? {};
            const names: string[] = [];
            Object.entries(state).forEach(([key, entries]: [string, any]) => {
              if (me?.id && key === me.id) return;
              (entries as any[]).forEach((entry) => {
                if (entry?.typing && entry?.name) names.push(entry.name);
              });
            });
            setTyping(Array.from(new Set(names)));
          } catch {
            setTyping([]);
          }
        })
        .subscribe((status: string) => {
          setLive(status === "SUBSCRIBED");
        });
    } catch {
      setLive(false);
      return;
    }

    channelRef.current = channel;

    return () => {
      setLive(false);
      setTyping([]);
      channelRef.current = null;
      try {
        void client.removeChannel(channel);
      } catch {
        // already gone
      }
    };
  }, [mode, projectId, me?.id, scheduleReload]);

  // ---------------------------------------------------------- read receipts
  useEffect(() => {
    if (mode !== "DIRECT" || !projectId || !msgs.length) return;
    const unread = msgs.filter(
      (m) => m.recipient_id && me?.id && m.recipient_id === me.id && !m.read_at,
    );
    if (!unread.length) return;
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: unread.map((m) => m.id) }),
    }).catch(() => {});
  }, [mode, projectId, msgs, me?.id]);

  // ------------------------------------------------------------------ scroll
  useEffect(() => {
    const node = bottom.current;
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs.length]);

  // ------------------------------------------------------------------- send
  async function send() {
    if (sending) return;
    if (!text.trim() && !pending.length) return;
    setSending(true);
    const value = text;
    const attachmentUrls = pending.map((file) => file.url);
    try {
      const response = await fetch(listUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: value.trim(),
          attachments: attachmentUrls,
          parent_id: replyTo?.id ?? null,
        }),
      });
      if (response.ok) {
        const created = await response.json();
        setMsgs((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
        setText("");
        setPending([]);
        setReplyTo(null);
        setAttachOpen(false);
      }
    } catch {
      // leave the text so the user can retry
    } finally {
      setSending(false);
    }
  }

  // -------------------------------------------------------------- reactions
  async function react(messageId: string, emoji: string) {
    // optimistic update
    setMine((prev) => {
      const current = prev[messageId] ?? [];
      const active = current.includes(emoji);
      return {
        ...prev,
        [messageId]: active ? current.filter((e) => e !== emoji) : [...current, emoji],
      };
    });
    setCounts((prev) => {
      const bucket = { ...(prev[messageId] ?? {}) };
      const active = (mine[messageId] ?? []).includes(emoji);
      bucket[emoji] = Math.max(0, (bucket[emoji] ?? 0) + (active ? -1 : 1));
      if (!bucket[emoji]) delete bucket[emoji];
      return { ...prev, [messageId]: bucket };
    });
    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      setCounts((prev) => {
        const bucket = { ...(prev[messageId] ?? {}) };
        if (data.count > 0) bucket[emoji] = data.count;
        else delete bucket[emoji];
        return { ...prev, [messageId]: bucket };
      });
      setMine((prev) => {
        const current = prev[messageId] ?? [];
        return {
          ...prev,
          [messageId]: data.active
            ? Array.from(new Set([...current, emoji]))
            : current.filter((e) => e !== emoji),
        };
      });
    } catch {
      void loadReactions(msgs.map((m) => m.id)); // resync on failure
    }
  }

  // ------------------------------------------------------------ edit/delete
  async function saveEdit() {
    if (!editing) return;
    const id = editing.id;
    const content = editing.value.trim();
    if (!content) return;
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      }
    } catch {
      // leave edit mode open so nothing is lost
    } finally {
      setEditing(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (response.ok) {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, deleted_at: new Date().toISOString(), content: "", attachments: [] }
              : m,
          ),
        );
      }
    } catch {
      // ignore
    }
  }

  // ---------------------------------------------------------------- typing
  function noteTyping() {
    const channel = channelRef.current;
    if (!channel || !me?.id) return;
    const now = Date.now();
    if (now - typingSentAt.current > 1200) {
      typingSentAt.current = now;
      try {
        void channel.track({ typing: true, name: me.name ?? "Someone", at: now });
      } catch {
        /* presence unavailable */
      }
    }
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      try {
        void channelRef.current?.untrack();
      } catch {
        /* already untracked */
      }
    }, TYPING_IDLE_MS);
  }

  // --------------------------------------------------------------- grouping
  const { tops, repliesOf } = useMemo(() => {
    const top: Msg[] = [];
    const map: Record<string, Msg[]> = {};
    msgs.forEach((message) => {
      if (message.parent_id) (map[message.parent_id] ??= []).push(message);
      else top.push(message);
    });
    return { tops: top, repliesOf: map };
  }, [msgs]);
  const byId = useMemo(() => {
    const map: Record<string, Msg> = {};
    msgs.forEach((m) => (map[m.id] = m));
    return map;
  }, [msgs]);

  const uploadFolder =
    mode === "GENERAL" ? "general" : `direct/${projectId}`;

  const renderMessage = (message: Msg, nested = false) => {
    const own = !!me?.id && message.sender_id === me.id;
    const isDeleted = !!message.deleted_at;
    const files = (message.attachments ?? []).filter(Boolean) as MessageAttachment[];
    const parent = message.parent_id ? byId[message.parent_id] : null;
    const bucket = counts[message.id] ?? {};
    const myReactions = mine[message.id] ?? [];

    return (
      <div
        key={message.id}
        className={`group flex gap-3 ${nested ? "ml-12" : ""} ${own ? "flex-row-reverse" : ""}`}
      >
        <span className="w-9 h-9 shrink-0 rounded-full bg-[#00f5d4]/10 text-cyan-300 grid place-items-center text-xs font-bold">
          {initialsOf(message.sender?.name)}
        </span>
        <div className={`max-w-2xl ${own ? "items-end text-right" : ""} flex flex-col`}>
          <p className="text-xs">
            <b>{own ? "You" : message.sender?.name || "IBF member"}</b>
            <time className="text-slate-500 ml-2">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            {message.edited_at && !isDeleted && (
              <span className="text-slate-500 ml-2 italic">edited</span>
            )}
          </p>

          {parent && (
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Replying to {byId[parent.id]?.sender?.name || "a message"}: "{(parent.content || "").slice(0, 60)}"
            </p>
          )}

          {editing?.id === message.id ? (
            <div className="mt-1.5 w-full">
              <textarea
                value={editing.value}
                onChange={(event) => setEditing({ id: message.id, value: event.target.value })}
                className="field min-h-20 text-sm"
                aria-label="Edit message"
              />
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={() => void saveEdit()}>
                  Save
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : isDeleted ? (
            <div className="mt-1.5 p-3 bg-white/[.03] border border-dashed border-white/10 rounded-xl text-sm italic text-slate-500">
              This message was deleted
            </div>
          ) : (
            <>
              {message.content && (
                <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-r-xl rounded-bl-xl text-sm leading-6 text-slate-800 text-left">
                  {message.content}
                </div>
              )}
              {files.length > 0 && (
                <AttachmentPreview files={files} align={own ? "right" : "left"} className="mt-2" />
              )}
            </>
          )}

          {Object.keys(bucket).length > 0 && (
            <div className={`flex gap-1 mt-1.5 ${own ? "justify-end" : ""}`}>
              {ALLOWED_REACTIONS.filter((emoji) => bucket[emoji]).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void react(message.id, emoji)}
                  aria-label={`${bucket[emoji]} ${emoji} reaction${myReactions.includes(emoji) ? ", including yours" : ""}`}
                  className={`pill border text-xs ${
                    myReactions.includes(emoji)
                      ? "border-[#00f5d4]/60 bg-[#00f5d4]/10 text-cyan-200"
                      : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {bucket[emoji]}
                </button>
              ))}
            </div>
          )}

          {mode === "DIRECT" && own && message.read_at && (
            <p className="text-[10px] text-emerald-400 mt-1">Read</p>
          )}

          {!isDeleted && (
            <MessageActions
              isOwn={own}
              reacted={myReactions}
              className={`mt-1 ${own ? "justify-end" : ""}`}
              onReact={(emoji) => void react(message.id, emoji)}
              onReply={() => setReplyTo(message)}
              onEdit={() => setEditing({ id: message.id, value: message.content })}
              onDelete={() => void remove(message.id)}
            />
          )}

          {!nested && (repliesOf[message.id]?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpanded((prev) =>
                  prev.includes(message.id)
                    ? prev.filter((id) => id !== message.id)
                    : [...prev, message.id],
                )
              }
              className="text-[11px] text-cyan-300 mt-2 text-left"
            >
              {expanded.includes(message.id)
                ? "Hide replies"
                : `${repliesOf[message.id].length} ${
                    repliesOf[message.id].length === 1 ? "reply" : "replies"
                  }`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <section className="flex-1 flex flex-col bg-white min-w-0">
        <div className="p-5 border-b border-white/[.07] flex items-center">
          {headerIcon}
          <div className="ml-3 min-w-0">
            <b>{title}</b>
            <p className="text-xs text-slate-500 truncate">
              {typing.length ? (
                <span className="text-cyan-300">
                  {typing.slice(0, 2).join(", ")} {typing.length === 1 ? "is" : "are"} typing…
                </span>
              ) : (
                <>
                  {subtitle}
                  {live && <span className="text-emerald-500 ml-2">● live</span>}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 overflow-auto space-y-6 bg-slate-50/60">
          {accessError ? (
            <div className="text-center mt-20">
              <p className="text-rose-500">{accessError}</p>
              <Link href={backHref} className="btn btn-secondary mt-4">
                Back to dashboard
              </Link>
            </div>
          ) : loading ? (
            <Loader2 className="animate-spin text-cyan-300 mx-auto mt-20" />
          ) : tops.length ? (
            tops.map((message) => (
              <div key={message.id} className="space-y-4">
                {renderMessage(message)}
                {expanded.includes(message.id) &&
                  (repliesOf[message.id] ?? []).map((reply) => renderMessage(reply, true))}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 mt-20">{emptyText}</p>
          )}
          <div ref={bottom} />
        </div>

        <div className="p-4 border-t border-white/[.07]">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs">
              <span className="text-slate-400">
                Replying to <b>{replyTo.sender_id === me?.id ? "yourself" : replyTo.sender?.name}</b>
                : "{(replyTo.content || "attachment").slice(0, 60)}"
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
                className="ml-auto text-slate-400 hover:text-rose-400"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pending.map((file, index) => (
                <span
                  key={file.path}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-[11px]"
                >
                  {file.name}
                  <span className="text-slate-500">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove ${file.name}`}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {attachOpen && (
            <div className="mb-3">
              <FileUploader
                bucket="chat-attachments"
                folderKey={uploadFolder}
                maxFiles={5}
                label="Attach files to this message"
                onChange={(files) => setPending(files)}
              />
            </div>
          )}

          <div className="flex items-center border border-slate-200 rounded-xl p-2">
            <button
              type="button"
              aria-label={attachOpen ? "Close attachments" : "Attach files"}
              aria-expanded={attachOpen}
              onClick={() => setAttachOpen((open) => !open)}
              className={`p-2 rounded-lg transition ${
                attachOpen ? "text-[#00f5d4] bg-[#00f5d4]/10" : "text-slate-400 hover:text-[#00f5d4]"
              }`}
            >
              <Paperclip size={19} />
            </button>
            <input
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                noteTyping();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              className="flex-1 px-2 outline-none text-sm bg-transparent"
              placeholder="Write a message…"
              aria-label="Message"
            />
            <button
              disabled={sending || (!text.trim() && !pending.length)}
              onClick={() => void send()}
              aria-label="Send message"
              className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </section>
      {aside}
    </div>
  );
}
