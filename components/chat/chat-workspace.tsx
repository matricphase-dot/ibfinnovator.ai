"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";
import {
  Hash,
  Lock,
  Users,
  Search,
  MessageSquare,
  FolderKanban,
  Kanban,
  Loader2,
  ChevronRight,
  Info,
  UserPlus,
} from "lucide-react";
import { ChannelSidebar, type Channel, type DirectMessagePeer } from "@/components/chat/sidebar/channel-sidebar";
import { MessageItem, type MessageData } from "@/components/chat/post/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { ThreadDrawer } from "@/components/chat/thread-drawer";
import { useSupabaseBrowser } from "@/lib/supabase/browser";

interface ChatWorkspaceProps {
  initialChannelId?: string;
  projectId?: string;
  projectName?: string;
}

// Group messages by date for clean timeline dividers
function groupMessagesByDate(messages: MessageData[]) {
  const groups: { dateLabel: string; messages: MessageData[] }[] = [];
  let currentDate = "";
  let currentGroup: MessageData[] = [];

  for (const msg of messages) {
    const d = new Date(msg.created_at);
    let label = format(d, "EEEE, MMMM d, yyyy");
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";

    if (label !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ dateLabel: currentDate, messages: currentGroup });
      }
      currentDate = label;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ dateLabel: currentDate, messages: currentGroup });
  }

  return groups;
}

export function ChatWorkspace({
  initialChannelId,
  projectId,
  projectName,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const supabase = useSupabaseBrowser();

  // State
  const [workspaceName, setWorkspaceName] = useState("IBF Community");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessagePeer[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId || "");
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [showMembersList, setShowMembersList] = useState(false);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [activeThread, setActiveThread] = useState<MessageData | null>(null);

  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const feedBottomRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  // 1. Fetch current user profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        if (profile) setMe({ id: profile.id, name: profile.name || "Member" });
      });
  }, []);

  // 2. Load Channels & Direct Messages
  const loadChannels = async () => {
    try {
      const res = await fetch("/api/chat/channels");
      if (res.ok) {
        const data = await res.json();
        setWorkspaceName(data.workspace?.name || "IBF Community");
        const chList: Channel[] = data.channels || [];
        setChannels(chList);
        setDirectMessages(data.direct_messages || []);

        // If no active channel selected, select first channel (e.g. general)
        if (!activeChannelId && chList.length > 0) {
          const generalCh = chList.find((c) => c.name === "general") || chList[0];
          setActiveChannelId(generalCh.id);
          setActiveChannel(generalCh);
        } else if (activeChannelId) {
          const current = chList.find((c) => c.id === activeChannelId);
          if (current) setActiveChannel(current);
        }
      }
    } finally {
      setLoadingChannels(false);
    }
  };

  useEffect(() => {
    void loadChannels();
  }, []);

  // 3. Load Active Channel Details & Messages
  const loadMessages = async (channelId: string) => {
    setLoadingMessages(true);
    try {
      const [chRes, msgRes] = await Promise.all([
        fetch(`/api/chat/channels/${channelId}`),
        fetch(`/api/chat/channels/${channelId}/messages`),
      ]);

      if (chRes.ok) {
        const chData = await chRes.json();
        setActiveChannel(chData.channel);
        setChannelMembers(chData.members || []);
      }

      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeChannelId) return;
    void loadMessages(activeChannelId);
  }, [activeChannelId]);

  // 4. Realtime Supabase Subscription for Channel Messages & Reactions
  useEffect(() => {
    if (!activeChannelId) return;

    if (realtimeChannelRef.current) {
      void supabase.removeChannel(realtimeChannelRef.current);
    }

    const realtime = supabase
      .channel(`chat-channel-${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // If it's a thread reply, update parent's reply_count
          if (newMsg.parent_id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newMsg.parent_id
                  ? {
                      ...m,
                      reply_count: (m.reply_count || 0) + 1,
                      last_reply_at: newMsg.created_at,
                    }
                  : m,
              ),
            );
            return;
          }

          // Otherwise, it's a root message in this channel feed
          // If we already have it optimistically, don't duplicate
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Fetch sender profile if not populated
            fetch(`/api/profile`)
              .then((r) => r.json())
              .catch(() => null);

            return [...prev, newMsg as MessageData];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          // Refresh reactions
          void loadMessages(activeChannelId);
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (payload?.name && payload?.userId !== me?.id) {
          const userName = payload.name;
          setTypingUsers((prev) =>
            prev.includes(userName) ? prev : [...prev, userName],
          );

          if (typingTimerRef.current[userName]) {
            clearTimeout(typingTimerRef.current[userName]);
          }

          typingTimerRef.current[userName] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== userName));
          }, 2500);
        }
      })
      .subscribe();

    realtimeChannelRef.current = realtime;

    return () => {
      if (realtimeChannelRef.current) {
        void supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [activeChannelId, me?.id, supabase]);

  // Auto-scroll to bottom of feed
  useEffect(() => {
    if (!loadingMessages && feedBottomRef.current) {
      feedBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMessages]);

  // 5. Message Actions Handlers
  const handleSendMessage = async (content: string, attachments: string[]) => {
    if (!activeChannelId) return false;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageData = {
      id: tempId,
      channel_id: activeChannelId,
      sender_id: me?.id || "me",
      content,
      attachments,
      created_at: new Date().toISOString(),
      status: "sending",
      sender: {
        id: me?.id || "me",
        name: me?.name || "You",
      },
      reactions: [],
      reply_count: 0,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/chat/channels/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachments }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const saved = await res.json();

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...saved, status: "sent" } : m)),
      );
      return true;
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    }
  };

  const handleBroadcastTyping = () => {
    if (realtimeChannelRef.current && me?.name) {
      void realtimeChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: me.id, name: me.name },
      });
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Optimistic reaction toggle in local state
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const curReactions = m.reactions || [];
        const hasReacted = curReactions.some(
          (r) => r.user_id === me?.id && r.emoji === emoji,
        );

        let nextReactions: any[];
        if (hasReacted) {
          nextReactions = curReactions.filter(
            (r) => !(r.user_id === me?.id && r.emoji === emoji),
          );
        } else {
          nextReactions = [...curReactions, { user_id: me?.id || "me", emoji }];
        }
        return { ...m, reactions: nextReactions };
      }),
    );

    // Call API
    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // Revert if error
      void loadMessages(activeChannelId);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "EDIT", content: newContent }),
    });

    if (res.ok) {
      const updated = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m)),
      );
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE" }),
    });

    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: "Message deleted", deleted_at: new Date().toISOString() }
            : m,
        ),
      );
    }
  };

  const handleCreateChannel = async (data: {
    name: string;
    description: string;
    is_private: boolean;
  }) => {
    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Failed to create channel");
    }

    const created = await res.json();
    setChannels((prev) => [...prev, created]);
    return created;
  };

  const dateGroups = groupMessagesByDate(messages);

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Left Pane: Channels Sidebar */}
      <ChannelSidebar
        workspaceName={workspaceName}
        channels={channels}
        directMessages={directMessages}
        activeChannelId={activeChannelId}
        currentUserId={me?.id}
        onSelectChannel={(chId) => {
          setActiveChannelId(chId);
          setActiveThread(null);
          router.push(`/chat/${chId}`);
        }}
        onCreateChannel={handleCreateChannel}
      />

      {/* 2. Center Pane: Message Feed & Chat Input */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
        {/* Channel Header */}
        <header className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeChannel?.is_private ? (
              <Lock size={18} className="text-slate-400 shrink-0" />
            ) : (
              <Hash size={18} className="text-cyan-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 truncate">
                {activeChannel?.name || "Loading..."}
              </h1>
              {activeChannel?.description && (
                <p className="text-xs text-slate-400 truncate max-w-md hidden sm:block">
                  {activeChannel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick toggle to Project Management */}
            {projectId && (
              <Link
                href={`/projects/${projectId}/board`}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                <Kanban size={13} />
                <span>Plane PM</span>
              </Link>
            )}

            {/* Member Count & Details Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMembersList(!showMembersList)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="View channel members"
              >
                <Users size={14} className="text-cyan-400" />
                <span>{channelMembers.length || 1}</span>
              </button>

              {/* Members Popover */}
              {showMembersList && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMembersList(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Channel Members ({channelMembers.length})
                    </div>
                    <div className="space-y-1">
                      {channelMembers.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-300 text-xs font-bold flex items-center justify-center">
                            {m.name?.slice(0, 2).toUpperCase() || "MB"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {m.name}
                            </div>
                            {m.username && (
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                @{m.username}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Message Feed Timeline */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Hash size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Welcome to #{activeChannel?.name || "channel"}!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                {activeChannel?.description ||
                  "This is the start of the conversation. Send a message to get things rolling."}
              </p>
            </div>
          ) : (
            dateGroups.map((group) => (
              <div key={group.dateLabel} className="space-y-1">
                {/* Date Divider Pill */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80" />
                  </div>
                  <span className="relative px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 shadow-sm">
                    {group.dateLabel}
                  </span>
                </div>

                {/* Messages in Group */}
                {group.messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={me?.id}
                    onReplyInThread={(msg) => setActiveThread(msg)}
                    onToggleReaction={handleToggleReaction}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={feedBottomRef} />
        </div>

        {/* Typing Indicators & Composer Footer */}
        <div className="p-4 pt-1 bg-slate-950/40">
          {/* Live Typing Indicator */}
          <div className="h-5 px-3 flex items-center">
            {typingUsers.length > 0 && (
              <p className="text-[11px] text-cyan-400 font-medium animate-pulse flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {typingUsers.join(", ")}{" "}
                {typingUsers.length === 1 ? "is typing…" : "are typing…"}
              </p>
            )}
          </div>

          {/* Composer */}
          <ChatInput
            placeholder={`Message #${activeChannel?.name || "channel"}…`}
            onSendMessage={handleSendMessage}
            onTyping={handleBroadcastTyping}
            userId={me?.id}
            disabled={!activeChannelId}
          />
        </div>
      </main>

      {/* 3. Right Pane: Thread RHS (Mattermost Collapsible Drawer) */}
      {activeThread && (
        <ThreadDrawer
          parentMessage={activeThread}
          channelName={activeChannel?.name}
          currentUserId={me?.id}
          onClose={() => setActiveThread(null)}
          onToggleReaction={handleToggleReaction}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      )}
    </div>
  );
}
