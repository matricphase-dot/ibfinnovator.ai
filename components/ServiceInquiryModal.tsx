"use client";

import { Loader2, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import toast from "react-hot-toast";

/**
 * Contact a provider about one listing.
 *
 * The 20-word minimum mirrors the API and the RLS insert policy. The counter
 * tells the sender how far they are from it, which is friendlier than letting
 * them submit and be rejected.
 */

const MIN_WORDS = 20;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export default function ServiceInquiryModal({
  serviceId,
  serviceTitle,
  providerName,
  onSent,
}: {
  serviceId: string;
  serviceTitle: string;
  providerName?: string;
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const words = countWords(message);
  const ready = words >= MIN_WORDS;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) {
      toast.error(`Please write at least ${MIN_WORDS} words (${words} so far).`);
      return;
    }
    setSending(true);
    try {
      const response = await fetch(`/api/marketplace/${serviceId}/inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Inquiry sent");
        setMessage("");
        setOpen(false);
        onSent?.();
      } else if (response.status === 409) {
        toast.error(payload.error || "This listing is not accepting inquiries.");
      } else {
        toast.error(payload.error || "Could not send your inquiry");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setSending(false);
    }
  }

  const dialogRef = useModalA11y<HTMLFormElement>(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary w-full !py-2 text-xs"
      >
        <Send size={14} />
        Contact provider
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto"
          >
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  SERVICE INQUIRY
                </p>
                <h2 className="text-xl font-black mt-1">{serviceTitle}</h2>
                {providerName && (
                  <p className="text-xs text-slate-500 mt-1">to {providerName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close inquiry dialog"
                className="ml-auto text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <label className="block text-sm font-bold mt-6">
              Your message
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="field mt-2 font-normal min-h-32"
                placeholder="Describe your project, timeline, budget range and what you need help with."
                maxLength={2000}
                required
              />
            </label>

            <p className={`text-[11px] mt-2 ${ready ? "text-cyan-300" : "text-slate-500"}`}>
              {words} / {MIN_WORDS} words minimum
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={sending || !ready}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                Send inquiry
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
