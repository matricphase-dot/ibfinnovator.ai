"use client";
import { Edit3, MessageCircle, Smile, Trash2 } from "lucide-react";
const emojis = ["👍", "❤️", "🔥", "👏", "🚀"];
export default function MessageActions({
  onReply,
  onReact,
  onEdit,
  onDelete,
  canModify = false,
}: {
  onReply: () => void;
  onReact: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canModify?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
      <button
        type="button"
        onClick={onReply}
        className="p-1.5 rounded hover:bg-white/10 text-slate-500"
        aria-label="Reply"
      >
        <MessageCircle size={13} />
      </button>
      <div className="group/reaction relative">
        <button
          type="button"
          className="p-1.5 rounded hover:bg-white/10 text-slate-500"
          aria-label="React"
        >
          <Smile size={13} />
        </button>
        <div className="hidden group-hover/reaction:flex absolute bottom-full left-0 z-10 bg-[#111827] border border-white/10 rounded-full p-1 shadow-xl">
          {emojis.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => onReact(e)}
              className="p-1 hover:scale-125"
              aria-label={`React ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      {canModify && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-500"
            aria-label="Edit message"
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-red-400"
            aria-label="Delete message"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}
