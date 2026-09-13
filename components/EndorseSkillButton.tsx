"use client";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
export default function EndorseSkillButton({
  receiverId,
  skill,
  initialCount = 0,
  disabled = false,
}: {
  receiverId: string;
  skill: string;
  initialCount?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [done, setDone] = useState(false),
    [count, setCount] = useState(initialCount);
  async function endorse() {
    const r = await fetch("/api/endorsements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receiver_id: receiverId, skill }),
      }),
      d = await r.json();
    if (r.ok) {
      setDone(true);
      setCount((x) => x + 1);
      setOpen(false);
      toast.success(`${skill} endorsed`);
    } else toast.error(d.error || "Unable to endorse");
  }
  return (
    <span className="relative inline-flex items-center gap-1">
      <span className="text-[10px] text-slate-500">{count}</span>
      {!disabled && (
        <button
          disabled={done}
          onClick={() => setOpen(!open)}
          className={`text-[10px] px-2 py-1 rounded-full border ${done ? "border-white/5 text-slate-600" : "border-cyan-300/20 text-cyan-300"}`}
        >
          {done ? (
            <>
              <Check size={10} className="inline" /> Endorsed
            </>
          ) : (
            <>
              <Plus size={10} className="inline" /> Endorse
            </>
          )}
        </button>
      )}
      {open && (
        <span className="absolute z-20 top-full left-0 mt-2 w-52 p-3 rounded-xl bg-[#111827] border border-white/10 shadow-xl">
          <b className="text-xs">Endorse {skill}?</b>
          <button
            onClick={endorse}
            className="btn btn-primary !py-1.5 w-full text-xs mt-3"
          >
            Confirm
          </button>
        </span>
      )}
    </span>
  );
}
