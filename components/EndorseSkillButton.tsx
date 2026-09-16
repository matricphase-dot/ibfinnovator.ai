"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * "+ Endorse" chip shown beside each skill on someone else's profile.
 *
 * Click confirms inline (no modal), then the chip locks — the API rejects a
 * duplicate with 409, so the button reflects that state rather than allowing a
 * request that cannot succeed.
 */

export default function EndorseSkillButton({
  receiverId,
  skill,
  count = 0,
  endorsed = false,
  onEndorsed,
}: {
  receiverId: string;
  skill: string;
  count?: number;
  endorsed?: boolean;
  onEndorsed?: (skill: string, count: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(endorsed);
  const [total, setTotal] = useState(count);

  async function endorse() {
    setBusy(true);
    try {
      const response = await fetch("/api/endorsements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receiver_id: receiverId, skill }),
      });
      const payload = await response.json();
      if (response.ok) {
        setDone(true);
        setTotal((value) => value + 1);
        toast.success(`Endorsed ${skill}`);
        onEndorsed?.(skill, total + 1);
      } else if (response.status === 409) {
        setDone(true);
        toast.error(payload.error || "You already endorsed this skill.");
      } else {
        toast.error(payload.error || "Could not endorse this skill");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (done) {
    return (
      <span
        className="pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
        title="You endorsed this skill"
      >
        <Check size={11} aria-hidden="true" />
        {skill}
        {total > 0 && <span className="opacity-70">· {total}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="pill bg-violet-50 text-violet-700">
        {skill}
        {total > 0 && <span className="opacity-70">· {total}</span>}
      </span>
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => void endorse()}
            disabled={busy}
            aria-label={`Confirm endorsement of ${skill}`}
            className="pill bg-cyan-300/15 text-cyan-200 border border-cyan-300/40 text-[11px]"
          >
            {busy ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            aria-label={`Cancel endorsing ${skill}`}
            className="text-[11px] text-slate-500 hover:text-slate-300"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Endorse ${skill}`}
          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-cyan-300 hover:text-cyan-200"
        >
          <Plus size={11} aria-hidden="true" />
          Endorse
        </button>
      )}
    </span>
  );
}
