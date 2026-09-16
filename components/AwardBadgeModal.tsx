"use client";

import { Award, Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import CollaboratorSelect, { type Collaborator } from "@/components/CollaboratorSelect";

/**
 * Founder-only: award a badge to an accepted collaborator, with evidence.
 * `disabled` is used by the project page when there is nobody to award yet.
 */

interface Definition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function AwardBadgeModal({
  projectId,
  projectTitle,
  disabled = false,
  onAwarded,
}: {
  projectId: string;
  projectTitle?: string;
  disabled?: boolean;
  onAwarded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [badgeId, setBadgeId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || definitions.length) return;
    fetch("/api/badges", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { definitions: [] }))
      .then((data) => setDefinitions(data?.definitions ?? []))
      .catch(() => {});
  }, [open, definitions.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (evidence.trim().length < 20) {
      toast.error("Please describe the contribution in at least 20 characters.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/badges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          badge_id: badgeId,
          receiver_id: receiverId,
          project_id: projectId,
          evidence: evidence.trim(),
        }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Badge awarded");
        setOpen(false);
        setEvidence("");
        setBadgeId("");
        setReceiverId("");
        onAwarded?.();
      } else if (response.status === 409) {
        toast.error(payload.error || "That badge was already awarded.");
      } else if (response.status === 403) {
        toast.error(payload.error || "You cannot award this badge.");
      } else {
        toast.error(payload.error || "Could not award badge");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={disabled ? "No accepted collaborators on this project yet" : undefined}
        className="btn btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Award size={16} />
        Award a badge
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto"
          >
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  RECOGNIZE CONTRIBUTION
                </p>
                <h2 className="text-xl font-black mt-1">Award a badge</h2>
                {projectTitle && (
                  <p className="text-xs text-slate-500 mt-1">{projectTitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close award badge dialog"
                className="ml-auto text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <CollaboratorSelect
              projectId={projectId}
              value={receiverId}
              onChange={setReceiverId}
            />

            <label className="block text-sm font-bold mt-4">
              Badge
              <select
                value={badgeId}
                onChange={(event) => setBadgeId(event.target.value)}
                required
                className="field mt-2"
              >
                <option value="">Select a badge</option>
                {definitions.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold mt-4">
              Evidence
              <textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                required
                minLength={20}
                maxLength={2000}
                className="field mt-2 min-h-28"
                placeholder="What did they actually do? Be specific — this text appears on their public credentials."
              />
              <span className="block text-[11px] text-slate-500 mt-1 font-normal">
                {evidence.trim().length}/20 characters minimum
              </span>
            </label>

            <button
              disabled={loading || !badgeId || !receiverId}
              className="btn btn-primary w-full mt-6"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
              {loading ? "Awarding…" : "Award badge"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
