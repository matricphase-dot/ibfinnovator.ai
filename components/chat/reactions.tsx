"use client";

import React, { useState } from "react";
import { Smile, Plus } from "lucide-react";

export interface Reaction {
  user_id: string;
  emoji: string;
}

interface ReactionsProps {
  reactions?: Reaction[];
  currentUserId?: string;
  onToggleReaction: (emoji: string) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "👏", "🚀", "🎉", "👀", "💯", "💡", "🙌"];

export function Reactions({
  reactions = [],
  currentUserId,
  onToggleReaction,
}: ReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const grouped: Record<string, { count: number; hasReacted: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { count: 0, hasReacted: false };
    }
    grouped[r.emoji].count += 1;
    if (currentUserId && r.user_id === currentUserId) {
      grouped[r.emoji].hasReacted = true;
    }
  }

  const emojiEntries = Object.entries(grouped);

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {emojiEntries.map(([emoji, { count, hasReacted }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors select-none ${
            hasReacted
              ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25"
              : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
          }`}
          title={hasReacted ? `You reacted with ${emoji}` : `React with ${emoji}`}
        >
          <span className="text-xs leading-none">{emoji}</span>
          <span className="text-[11px] font-semibold">{count}</span>
        </button>
      ))}

      {/* Add reaction button with popup */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-dashed border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800/60 transition-colors"
          title="Add reaction"
        >
          <Plus size={12} />
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute left-0 bottom-full mb-1.5 z-50 flex items-center gap-1 p-1.5 bg-slate-900 border border-slate-700 rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-100">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(emoji);
                    setShowPicker(false);
                  }}
                  className="p-1.5 hover:scale-125 transition-transform text-sm leading-none rounded-full hover:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
