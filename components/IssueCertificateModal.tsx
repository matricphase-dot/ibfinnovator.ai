"use client";
import { Check, Copy, FileCheck2, Loader2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useModalA11y } from "./useModalA11y";
export default function IssueCertificateModal({
  projectId,
  disabled = false,
}: {
  projectId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [people, setPeople] = useState<any[]>([]),
    [loading, setLoading] = useState(false),
    [code, setCode] = useState("");
  const modalRef = useModalA11y(open, () => setOpen(false));
  async function show() {
    if (disabled) return;
    setOpen(true);
    const [connections, me] = await Promise.all([
      fetch("/api/connections").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    const map = new Map();
    (Array.isArray(connections) ? connections : [])
      .filter((c: any) => c.project_id === projectId && c.status === "ACCEPTED")
      .forEach((c: any) =>
        [c.requester, c.recipient]
          .filter((p: any) => p && p.id !== me.id)
          .forEach((p: any) => map.set(p.id, p)),
      );
    setPeople([...map.values()]);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          receiver_id: f.get("receiver_id"),
          role_title: f.get("role_title"),
          started_at: f.get("started_at"),
          completed_at: f.get("completed_at"),
        }),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) setCode(d.verification_code);
    else toast.error(d.error || "Could not issue certificate");
  }
  return (
    <>
      <button
        disabled={disabled}
        title={disabled ? "No accepted collaborators yet" : undefined}
        onClick={show}
        className="btn btn-secondary disabled:opacity-40"
      >
        <FileCheck2 size={16} />
        Issue Certificate
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
          <div
            ref={modalRef as any}
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-title"
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6"
          >
            {code ? (
              <div className="text-center">
                <Check className="mx-auto text-cyan-300" size={40} />
                <h2 className="text-2xl font-black mt-4">Certificate issued</h2>
                <p className="text-sm text-slate-500 mt-2">Verification code</p>
                <code className="block p-3 mt-3 bg-white/5 rounded">
                  {code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Copied");
                  }}
                  className="btn btn-secondary mt-4"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setCode("");
                  }}
                  className="btn btn-primary mt-4 ml-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex">
                  <h2 className="text-xl font-black">
                    Issue experience certificate
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="ml-auto"
                  >
                    <X />
                  </button>
                </div>
                <label className="block text-sm font-bold mt-6">
                  Collaborator
                  <select required name="receiver_id" className="field mt-2">
                    <option value="">Select</option>
                    {people.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold mt-4">
                  Role title
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    name="role_title"
                    className="field mt-2"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <label className="text-sm font-bold">
                    Start date
                    <input
                      type="date"
                      name="started_at"
                      className="field mt-2"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    End date
                    <input
                      type="date"
                      name="completed_at"
                      className="field mt-2"
                    />
                  </label>
                </div>
                <button
                  disabled={loading}
                  className="btn btn-primary w-full mt-6"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Issue certificate
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
