"use client";

import React, { useState } from "react";
import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";
import { MessageSquare, Paperclip, FileText, ExternalLink, Check, X } from "lucide-react";
import { Reactions, type Reaction } from "@/components/chat/reactions";
import { PostActions } from "@/components/chat/post-actions";

export interface MessageSender {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
}

export interface MessageData {
  id: string;
  channel_id?: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  parent_id?: string | null;
  attachments?: string[];
  pinned?: boolean;
  sender?: MessageSender;
  reactions?: Reaction[];
  reply_count?: number;
  last_reply_at?: string | null;
  status?: "sending" | "sent" | "error";
}

interface MessageItemProps {
  message: MessageData;
  currentUserId?: string;
  onReplyInThread?: (message: MessageData) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  isThreadView?: boolean;
}

function formatMessageTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) {
      return format(d, "h:mm a");
    }
    if (isYesterday(d)) {
      return `Yesterday at ${format(d, "h:mm a")}`;
    }
    return format(d, "MMM d, h:mm a");
  } catch {
    return dateStr;
  }
}

// Simple, safe inline markdown parser for chat posts
function renderFormattedContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[13px] border border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function MessageItem({
  message,
  currentUserId,
  onReplyInThread,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
  isThreadView = false,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);

  const isAuthor = currentUserId === message.sender_id;
  const isDeleted = Boolean(message.deleted_at);

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === message.content || !onEditMessage) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onEditMessage(message.id, editText.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (onDeleteMessage && window.confirm("Are you sure you want to delete this message?")) {
      await onDeleteMessage(message.id);
    }
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content);
  };

  return (
    <div
      className={`group relative flex gap-3 px-4 py-2 hover:bg-slate-900/60 transition-colors duration-100 ${
        message.status === "sending" ? "opacity-60" : ""
      }`}
      id={`msg-${message.id}`}
    >
      {/* Post Actions Toolbar */}
      {!isDeleted && !isEditing && (
        <PostActions
          onReplyInThread={!isThreadView && onReplyInThread ? () => onReplyInThread(message) : undefined}
          onReact={(emoji) => onToggleReaction(message.id, emoji)}
          onEdit={isAuthor && onEditMessage ? () => setIsEditing(true) : undefined}
          onDelete={isAuthor && onDeleteMessage ? handleDelete : undefined}
          onCopyText={handleCopy}
          isAuthor={isAuthor}
        />
      )}

      {/* Author Avatar */}
      <div className="shrink-0 pt-0.5">
        {message.sender?.avatar_url ? (
          <Image
            src={message.sender.avatar_url}
            alt={message.sender.name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs select-none shadow-sm">
            {message.sender?.name ? message.sender.name.slice(0, 2).toUpperCase() : "IB"}
          </div>
        )}
      </div>

      {/* Message Content & Header */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-slate-100 text-sm hover:underline cursor-pointer">
            {message.sender?.name || "Member"}
          </span>
          {message.sender?.username && (
            <span className="text-[11px] text-cyan-400 font-mono">
              @{message.sender.username}
            </span>
          )}
          <time
            className="text-[11px] text-slate-400 font-mono"
            dateTime={message.created_at}
          >
            {formatMessageTime(message.created_at)}
          </time>
          {message.edited_at && !isDeleted && (
            <span className="text-[10px] text-slate-400 italic">(edited)</span>
          )}
          {message.status === "sending" && (
            <span className="text-[10px] text-cyan-400/80 animate-pulse">sending...</span>
          )}
        </div>

        {/* Message Body or Edit Mode */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSaveEdit();
                } else if (e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
              className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                <Check size={13} />
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
              >
                <X size={13} />
                Cancel
              </button>
              <span className="text-[11px] text-slate-400 ml-auto">
                Press Enter to save · Esc to cancel
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
            {isDeleted ? (
              <span className="text-slate-400 italic">This message was deleted.</span>
            ) : (
              renderFormattedContent(message.content)
            )}
          </div>
        )}

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && !isDeleted && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {message.attachments.map((url, i) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
              if (isImage) {
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/img relative block rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 max-w-xs transition-transform hover:scale-[1.01]"
                  >
                    <Image
                      src={url}
                      alt="Attachment"
                      width={320}
                      height={200}
                      className="max-h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                      <ExternalLink size={14} /> Open Full Size
                    </div>
                  </a>
                );
              }

              const filename = url.split("/").pop()?.split("?")[0] || "Attachment";
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-200 text-xs transition-colors"
                >
                  <FileText size={16} className="text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[200px] font-medium">{filename}</span>
                  <ExternalLink size={12} className="text-slate-400 shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {/* Reactions Pills */}
        {!isDeleted && (
          <Reactions
            reactions={message.reactions}
            currentUserId={currentUserId}
            onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          />
        )}

        {/* Thread Replies Button (Mattermost RHS preview) */}
        {!isThreadView && Boolean(message.reply_count && message.reply_count > 0) && onReplyInThread && (
          <button
            type="button"
            onClick={() => onReplyInThread(message)}
            className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20"
          >
            <MessageSquare size={13} />
            <span>
              {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
            </span>
            {message.last_reply_at && (
              <span className="text-slate-400 text-[11px]">
                · Last reply {formatMessageTime(message.last_reply_at)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
