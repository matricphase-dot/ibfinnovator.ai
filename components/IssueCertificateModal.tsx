"use client";

import { Check, Copy, FileCheck2, Loader2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import CollaboratorSelect from "@/components/CollaboratorSelect";

/**
 * Founder-only: issue an experience certificate. On success the verification
 * code is shown with a copy button, because that code is what the member shares.
 */

export default function IssueCertificateModal({
  projectId,
  projectTitle,
  disabled = false,
  onIssued,
}: {
  projectId: string;
  projectTitle?: string;
  disabled?: boolean;
  onIssued?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<{ code: string; name?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function close() {
    setOpen(false);
    setIssued(null);
    setCopied(false);
    setRoleTitle("");
    setStartedAt("");
    setCompletedAt("");
    setReceiverId("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (startedAt && completedAt && startedAt > completedAt) {
      toast.error("The start date must be on or before the completion date.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId,
          project_id: projectId,
          role_title: roleTitle.trim(),
          ...(startedAt ? { started_at: startedAt } : {}),
          ...(completedAt ? { completed_at: completedAt } : {}),
        }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Certificate issued");
        setIssued({ code: payload.verification_code });
        onIssued?.();
      } else if (response.status === 409) {
        toast.error(payload.error || "A certificate already exists for this project.");
      } else if (response.status === 403) {
        toast.error(payload.error || "You cannot issue this certificate.");
      } else {
        toast.error(payload.error || "Could not issue certificate");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
      toast.success("Verification code copied");
    } catch {
      toast.error("Could not copy — select the code manually");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={disabled ? "No accepted collaborators on this project yet" : undefined}
        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileCheck2 size={16} />
        Issue a certificate
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto">
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  VERIFIED EXPERIENCE
                </p>
                <h2 className="text-xl font-black mt-1">
                  {issued ? "Certificate issued" : "Issue a certificate"}
                </h2>
                {projectTitle && !issued && (
                  <p className="text-xs text-slate-500 mt-1">{projectTitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close issue certificate dialog"
                className="ml-auto text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            {issued ? (
              <div className="mt-6">
                <p className="text-sm text-slate-400">
                  Share this verification code with the member. Anyone holding it
                  can confirm the certificate without signing in.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/[.06] p-3">
                  <code className="font-mono text-xs break-all flex-1">
                    {issued.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    aria-label="Copy verification code"
                    className="shrink-0 p-2 rounded-lg text-cyan-300 hover:bg-white/5"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button type="button" onClick={close} className="btn btn-primary w-full mt-6">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <CollaboratorSelect
                  projectId={projectId}
                  value={receiverId}
                  onChange={setReceiverId}
                />

                <label className="block text-sm font-bold mt-4">
                  Role title
                  <input
                    value={roleTitle}
                    onChange={(event) => setRoleTitle(event.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    className="field mt-2"
                    placeholder="Backend Engineer"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <label className="block text-sm font-bold">
                    Started
                    <input
                      type="date"
                      value={startedAt}
                      onChange={(event) => setStartedAt(event.target.value)}
                      className="field mt-2"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    Completed
                    <input
                      type="date"
                      value={completedAt}
                      onChange={(event) => setCompletedAt(event.target.value)}
                      className="field mt-2"
                    />
                  </label>
                </div>

                <button
                  disabled={loading || !receiverId || roleTitle.trim().length < 2}
                  className="btn btn-primary w-full mt-6"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileCheck2 size={16} />
                  )}
                  {loading ? "Issuing…" : "Issue certificate"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
