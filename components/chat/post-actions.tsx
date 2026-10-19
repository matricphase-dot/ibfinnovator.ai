"use client";

import React, { useState } from "react";
import {
  MessageSquareReply,
  Smile,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

interface PostActionsProps {
  onReplyInThread?: () => void;
  onReact: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyText: () => void;
  isAuthor?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "👏", "🚀"];

export function PostActions({
  onReplyInThread,
  onReact,
  onEdit,
  onDelete,
  onCopyText,
  isAuthor = false,
}: PostActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const handleCopy = () => {
    onCopyText();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute right-4 -top-3.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 z-20 flex items-center bg-slate-900 border border-slate-700/80 rounded-lg shadow-lg px-1 py-0.5 space-x-0.5">
      {/* Quick reaction pills */}
      <div className="hidden sm:flex items-center space-x-0.5 border-r border-slate-700/60 pr-1 mr-0.5">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="p-1 text-xs hover:scale-125 transition-transform rounded hover:bg-slate-800"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Extra reactions picker toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiMenu(!showEmojiMenu)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Add Reaction"
        >
          <Smile size={14} />
        </button>

        {showEmojiMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiMenu(false)}
            />
            <div className="absolute right-0 bottom-full mb-1 z-50 flex items-center gap-1 p-1.5 bg-slate-900 border border-slate-700 rounded-full shadow-2xl">
              {["🎉", "👀", "💯", "💡", "🙌", "✨", "❤️", "👍"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(emoji);
                    setShowEmojiMenu(false);
                  }}
                  className="p-1.5 text-sm hover:scale-125 transition-transform rounded-full hover:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reply in thread */}
      {onReplyInThread && (
        <button
          type="button"
          onClick={onReplyInThread}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
          title="Reply in thread"
        >
          <MessageSquareReply size={14} />
        </button>
      )}

      {/* Copy message text */}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        title={copied ? "Copied!" : "Copy message"}
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>

      {/* Author actions: Edit & Delete */}
      {isAuthor && (
        <>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Edit message"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
