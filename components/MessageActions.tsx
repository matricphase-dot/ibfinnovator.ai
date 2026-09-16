"use client";

import { Pencil, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { ALLOWED_REACTIONS } from "@/lib/messages";

/**
 * Hover toolbar for a message: reply, react, and — for your own messages only —
 * edit and delete. The reaction row is always visible when a message already
 * has reactions; the buttons themselves appear on hover or keyboard focus, and
 * stay reachable via focus-within for keyboard users.
 */

export interface MessageActionsProps {
  isOwn: boolean;
  reacted?: string[];
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  className?: string;
}

export default function MessageActions({
  isOwn,
  reacted = [],
  onReply,
  onEdit,
  onDelete,
  onReact,
  className = "",
}: MessageActionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition ${className}`}
    >
      {onReact && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-label="Add a reaction"
            aria-expanded={pickerOpen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f5d4] hover:bg-white/5 transition"
          >
            <span aria-hidden="true" className="text-sm leading-none">
              😊
            </span>
          </button>
          {pickerOpen && (
            <div
              role="menu"
              aria-label="Choose a reaction"
              className="absolute bottom-full mb-1.5 left-0 z-30 flex gap-1 rounded-xl border border-white/15 bg-[#111827] p-1.5 shadow-xl"
            >
              {ALLOWED_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onReact(emoji);
                    setPickerOpen(false);
                  }}
                  aria-label={`React with ${emoji}`}
                  className={`w-7 h-7 grid place-items-center rounded-lg text-sm transition hover:bg-white/10 ${
                    reacted.includes(emoji) ? "bg-[#00f5d4]/15 ring-1 ring-[#00f5d4]/50" : ""
                  }`}
                >
                  <span aria-hidden="true">{emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {onReply && (
        <button
          type="button"
          onClick={onReply}
          aria-label="Reply to this message"
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f5d4] hover:bg-white/5 transition"
        >
          <Reply size={14} />
        </button>
      )}

      {isOwn && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit your message"
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f5d4] hover:bg-white/5 transition"
        >
          <Pencil size={14} />
        </button>
      )}

      {isOwn && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete your message"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
