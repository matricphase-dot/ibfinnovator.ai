"use client";
import AppShell from "@/components/AppShell";
import AttachmentPreview from "@/components/AttachmentPreview";
import FileUploader from "@/components/FileUploader";
import MessageActions from "@/components/MessageActions";
import { ALLOWED_REACTIONS } from "@/lib/messages";
import type { UploadedFile } from "@/lib/upload";
import { Loader2, Paperclip, Plus, Send, Users, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function Team() {
  const { projectId } = useParams<{ projectId: string }>(),
    [d, setD] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [channel, setChannel] = useState("General"),
    [text, setText] = useState(""),
    [task, setTask] = useState(""),
    [me, setMe] = useState<any>(null),
    [pending, setPending] = useState<UploadedFile[]>([]),
    [attachOpen, setAttachOpen] = useState(false);
  async function load() {
    const r = await fetch(`/api/team/${projectId}`, { cache: "no-store" }),
      x = await r.json();
    r.ok ? setD(x) : toast.error(x.error);
    setLoading(false);
  }
  useEffect(() => {
    load();
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.id && setMe(data))
      .catch(() => {});
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [projectId]);
  async function message() {
    if (!text.trim() && !pending.length) return;
    const r = await fetch("/api/team/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        room_id: d.room.id,
        channel,
        content: text.trim(),
        attachments: pending.map((file) => file.url),
      }),
    });
    if (r.ok) {
      setText("");
      setPending([]);
      setAttachOpen(false);
      load();
    } else toast.error("Could not send message");
  }
  async function addTask() {
    if (!task.trim()) return;
    const r = await fetch("/api/team/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ room_id: d.room.id, channel, title: task }),
    });
    if (r.ok) {
      setTask("");
      load();
    } else toast.error("Could not add task");
  }
  async function move(id: string, status: string) {
    await fetch("/api/team/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }
  async function react(message_id: string, emoji: string) {
    await fetch("/api/team/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message_id, emoji }),
    });
    load();
  }
  async function pin(id: string, pinned: boolean) {
    await fetch("/api/team/messages", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, pinned }),
    });
    load();
  }
  if (loading)
    return (
      <AppShell>
        <div className="min-h-[70vh] grid place-items-center">
          <Loader2 className="animate-spin text-cyan-300" />
        </div>
      </AppShell>
    );
  if (!d)
    return (
      <AppShell>
        <div className="p-10 text-center">Team room unavailable.</div>
      </AppShell>
    );
  const messages = d.messages.filter((m: any) => m.channel === channel);
  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center">
          <span className="w-12 h-12 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center font-black">
            {d.project.title.slice(0, 2).toUpperCase()}
          </span>
          <div className="ml-3">
            <h1 className="text-xl font-black">{d.project.title}</h1>
            <p className="text-xs text-slate-500">
              Team workspace · {d.members.length} members
            </p>
          </div>
        </div>
        <div className="grid lg:grid-cols-[210px_1fr_360px] gap-5 mt-7">
          <aside className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-500">CHANNELS</p>
            {d.room.channels.map((x: string) => (
              <button
                onClick={() => setChannel(x)}
                className={`w-full text-left p-2.5 rounded-lg mt-2 text-sm font-semibold ${x === channel ? "bg-cyan-300/10 text-cyan-300" : "text-slate-400"}`}
                key={x}
              >
                # {x}
              </button>
            ))}
            <p className="text-xs font-black text-slate-500 mt-7">MEMBERS</p>
            {d.members.map((m: any) => (
              <div className="flex items-center gap-2 mt-3" key={m.user_id}>
                <span className="h-7 w-7 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-[9px]">
                  {m.profile?.name?.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs">{m.profile?.name}</span>
              </div>
            ))}
          </aside>
          <section className="bg-white border border-slate-200 rounded-2xl min-h-[560px] flex flex-col">
            <div className="p-4 border-b border-white/[.07]">
              <b># {channel}</b>
            </div>
            <div className="p-5 space-y-5 flex-1 overflow-auto">
              {messages.length ? (
                messages.map((m: any) => (
                  <div className="flex gap-3" key={m.id}>
                    <span className="w-9 h-9 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs">
                      {m.sender?.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="flex">
                        <b className="text-sm">{m.sender?.name}</b>
                        {m.pinned && (
                          <span className="ml-2 text-[9px] text-amber-300">
                            PINNED
                          </span>
                        )}
                        <button
                          onClick={() => pin(m.id, !m.pinned)}
                          className="ml-auto text-[10px] text-slate-500 hover:text-cyan-300"
                        >
                          {m.pinned ? "Unpin" : "Pin"}
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{m.content}</p>
                      {m.attachments?.length > 0 && (
                        <AttachmentPreview files={m.attachments} className="mt-2" />
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {ALLOWED_REACTIONS.filter(
                          (e) => m.reactions?.some((r: any) => r.emoji === e),
                        ).map((e) => {
                          const list = m.reactions.filter((r: any) => r.emoji === e);
                          const isMine = !!me?.id && list.some((r: any) => r.user_id === me.id);
                          return (
                            <button
                              key={e}
                              onClick={() => react(m.id, e)}
                              aria-label={`${list.length} ${e} reaction${isMine ? ", including yours" : ""}`}
                              className={`pill border text-[10px] ${
                                isMine
                                  ? "border-[#00f5d4]/60 bg-[#00f5d4]/10 text-cyan-200"
                                  : "border-white/10 bg-white/[.04] text-slate-300"
                              }`}
                            >
                              <span aria-hidden="true">{e}</span>
                              {list.length}
                            </button>
                          );
                        })}
                        <MessageActions
                          isOwn={!!me?.id && m.sender_id === me.id}
                          reacted={
                            me?.id
                              ? (m.reactions ?? [])
                                  .filter((r: any) => r.user_id === me.id)
                                  .map((r: any) => r.emoji)
                              : []
                          }
                          className="ml-1"
                          onReact={(emoji) => react(m.id, emoji)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center mt-20">
                  No messages in this channel yet.
                </p>
              )}
            </div>
            <div className="m-4">
              {pending.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pending.map((file, index) => (
                    <span
                      key={file.path}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-[11px] text-slate-300"
                    >
                      {file.name}
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
                    bucket="team-files"
                    folderKey={d.room.id}
                    maxFiles={5}
                    label="Attach files to this channel"
                    onChange={setPending}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAttachOpen((open) => !open)}
                  aria-label={attachOpen ? "Close attachments" : "Attach files"}
                  aria-expanded={attachOpen}
                  className={`btn btn-secondary !px-3 ${attachOpen ? "!text-cyan-300" : ""}`}
                >
                  <Paperclip size={16} />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && message()}
                  className="field"
                  placeholder={`Message #${channel}`}
                />
                <button onClick={message} className="btn btn-primary">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </section>
          <aside className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex">
              <div>
                <b>Task board</b>
                <p className="text-xs text-slate-500 mt-1">
                  Channel: {channel}
                </p>
              </div>
              <Users className="ml-auto text-cyan-300" />
            </div>
            <div className="flex gap-2 mt-4">
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="field !py-2"
                placeholder="Add a task"
              />
              <button onClick={addTask} className="btn btn-primary !px-3">
                <Plus size={15} />
              </button>
            </div>
            {["TODO", "IN_PROGRESS", "DONE"].map((status) => (
              <div className="mt-5" key={status}>
                <p className="text-[9px] tracking-widest text-slate-500 font-bold">
                  {status.replace("_", " ")}
                </p>
                <div className="space-y-2 mt-2">
                  {d.tasks
                    .filter(
                      (t: any) => t.status === status && t.channel === channel,
                    )
                    .map((t: any) => (
                      <div
                        className="p-3 rounded-xl border border-white/[.07] bg-white/[.02]"
                        key={t.id}
                      >
                        <p className="text-xs font-bold">{t.title}</p>
                        <select
                          value={t.status}
                          onChange={(e) => move(t.id, e.target.value)}
                          className="mt-2 bg-transparent text-[10px] text-cyan-300 outline-none"
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
