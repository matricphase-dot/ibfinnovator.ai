"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Loader2 } from "lucide-react";
import { MessageItem, type MessageData } from "@/components/chat/post/message-item";
import { ChatInput } from "@/components/chat/chat-input";

interface ThreadDrawerProps {
  parentMessage: MessageData;
  channelName?: string;
  currentUserId?: string;
  onClose: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export function ThreadDrawer({
  parentMessage,
  channelName = "channel",
  currentUserId,
  onClose,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
}: ThreadDrawerProps) {
  const [replies, setReplies] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load thread replies
  const loadReplies = async () => {
    try {
      const res = await fetch(`/api/chat/threads/${parentMessage.id}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
      }
    } catch {
      // Keep existing state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadReplies();
  }, [parentMessage.id]);

  // Scroll to bottom on new replies
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies, loading]);

  const handleSendReply = async (content: string, attachments: string[]) => {
    // Optimistic reply
    const tempId = `temp-${Date.now()}`;
    const optimisticReply: MessageData = {
      id: tempId,
      channel_id: parentMessage.channel_id,
      sender_id: currentUserId || "me",
      content,
      attachments,
      parent_id: parentMessage.id,
      created_at: new Date().toISOString(),
      status: "sending",
      sender: {
        id: currentUserId || "me",
        name: "You",
      },
      reactions: [],
    };

    setReplies((prev) => [...prev, optimisticReply]);

    try {
      const res = await fetch(`/api/chat/threads/${parentMessage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachments }),
      });

      if (!res.ok) throw new Error("Failed to post reply");
      const savedReply = await res.json();

      setReplies((prev) =>
        prev.map((r) => (r.id === tempId ? { ...savedReply, status: "sent" } : r)),
      );
      return true;
    } catch {
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      return false;
    }
  };

  return (
    <aside className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-slate-950 border-l border-slate-800/80 shadow-2xl z-30 shrink-0">
      {/* Thread Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare size={16} className="text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-100 text-sm truncate">
            Thread
          </span>
          <span className="text-xs text-slate-500 font-mono truncate">
            #{channelName}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Close Thread (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {/* Root Parent Message */}
        <div className="pb-3 border-b border-slate-800/80 bg-slate-900/20 rounded-xl">
          <MessageItem
            message={parentMessage}
            currentUserId={currentUserId}
            onToggleReaction={onToggleReaction}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            isThreadView
          />
        </div>

        {/* Reply Count Separator */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="text-xs font-semibold text-slate-400">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
          <div className="flex-1 h-[1px] bg-slate-800" />
        </div>

        {/* Thread Replies List */}
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-1">
            {replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                currentUserId={currentUserId}
                onToggleReaction={onToggleReaction}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                isThreadView
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Thread Composer Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <ChatInput
          placeholder={`Reply to @${parentMessage.sender?.name || "thread"}…`}
          onSendMessage={handleSendReply}
          userId={currentUserId}
        />
      </div>
    </aside>
  );
}
