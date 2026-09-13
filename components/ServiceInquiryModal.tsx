"use client";
import { Send, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
export default function ServiceInquiryModal({
  serviceId,
  onClose,
}: {
  serviceId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false),
    [success, setSuccess] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      r = await fetch(`/api/marketplace/${serviceId}/inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: f.get("message") }),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) setSuccess(true);
    else toast.error(d.error || "Could not send inquiry");
  }
  return (
    <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6">
        {success ? (
          <div className="text-center">
            <Send className="mx-auto text-cyan-300" />
            <h2 className="text-xl font-black mt-4">Inquiry sent</h2>
            <p className="text-sm text-slate-500 mt-2">
              The provider can now review your request.
            </p>
            <button onClick={onClose} className="btn btn-primary mt-5">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex">
              <h2 className="text-xl font-black">Contact provider</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="ml-auto"
              >
                <X />
              </button>
            </div>
            <label className="block text-sm font-bold mt-6">
              Your request (minimum 20 words)
              <textarea
                required
                maxLength={2000}
                name="message"
                className="field mt-2 min-h-36"
                placeholder="Describe the work, expected outcome, timeline, budget context, and any questions."
              />
            </label>
            <button disabled={loading} className="btn btn-primary w-full mt-6">
              {loading ? "Sending…" : "Send inquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
