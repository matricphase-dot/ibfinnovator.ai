"use client";

import { Loader2, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import toast from "react-hot-toast";

/**
 * Create or edit a service listing. One form serves both: pass `initial` to
 * edit an existing listing, omit it to create one. Deleting is offered only
 * when editing, because a listing that does not exist yet cannot be deleted.
 *
 * The API is the source of truth for validation (title >= 3 chars, description
 * >= 30, at least one skill); the checks here exist to fail fast in the UI.
 */

export type ServiceListing = {
  id?: string;
  title: string;
  description: string;
  skills: string[];
  pricing_note?: string | null;
  availability?: string | null;
  status?: string;
};

const EMPTY: ServiceListing = {
  title: "",
  description: "",
  skills: [],
  pricing_note: "",
  availability: "",
  status: "ACTIVE",
};

export default function ServiceListingForm({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: ServiceListing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceListing>(EMPTY);
  const [skillsText, setSkillsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = initial ?? EMPTY;
    setForm(source);
    setSkillsText((source.skills ?? []).join(", "));
  }, [open, initial]);

  const dialogRef = useModalA11y<HTMLFormElement>(open, onClose);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (form.title.trim().length < 3) {
      toast.error("Give your service a title of at least 3 characters.");
      return;
    }
    if (form.description.trim().length < 30) {
      toast.error("Describe the service in at least 30 characters.");
      return;
    }
    if (skills.length === 0) {
      toast.error("Add at least one skill, separated by commas.");
      return;
    }

    setSaving(true);
    try {
      const editing = Boolean(initial?.id);
      const response = await fetch(
        editing ? `/api/marketplace/${initial!.id}` : "/api/marketplace",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            skills,
            pricing_note: form.pricing_note?.trim() || null,
            availability: form.availability?.trim() || null,
            status: form.status || "ACTIVE",
          }),
        },
      );
      const payload = await response.json();
      if (response.ok) {
        toast.success(editing ? "Listing updated" : "Listing published");
        onSaved();
        onClose();
      } else {
        toast.error(payload.error || "Could not save this listing");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this listing? Its inquiries are removed too.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/marketplace/${initial.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Listing deleted");
        onSaved();
        onClose();
      } else {
        toast.error(payload.error || "Could not delete this listing");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setDeleting(false);
    }
  }

  return (
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
              SERVICE MARKETPLACE
            </p>
            <h2 className="text-xl font-black mt-1">
              {initial?.id ? "Edit your listing" : "List a service"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close listing form"
            className="ml-auto text-slate-400 hover:text-white"
          >
            <X />
          </button>
        </div>

        <label className="block text-sm font-bold mt-6">
          Title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="field mt-2 font-normal"
            placeholder="Landing page design and build"
            maxLength={140}
            required
          />
        </label>

        <label className="block text-sm font-bold mt-4">
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="field mt-2 font-normal min-h-28"
            placeholder="What you deliver, how you work, and who it is for."
            maxLength={3000}
            required
          />
        </label>

        <label className="block text-sm font-bold mt-4">
          Skills
          <input
            value={skillsText}
            onChange={(event) => setSkillsText(event.target.value)}
            className="field mt-2 font-normal"
            placeholder="figma, react, copywriting"
            required
          />
          <span className="block text-[11px] text-slate-500 font-normal mt-1">
            Comma separated. Shown as chips on your card.
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="block text-sm font-bold">
            Pricing note
            <input
              value={form.pricing_note ?? ""}
              onChange={(event) => setForm({ ...form, pricing_note: event.target.value })}
              className="field mt-2 font-normal"
              placeholder="From ₹15,000 / project"
              maxLength={200}
            />
          </label>
          <label className="block text-sm font-bold">
            Availability
            <input
              value={form.availability ?? ""}
              onChange={(event) => setForm({ ...form, availability: event.target.value })}
              className="field mt-2 font-normal"
              placeholder="10 hrs / week"
              maxLength={120}
            />
          </label>
        </div>

        <label className="block text-sm font-bold mt-4">
          Status
          <select
            value={form.status ?? "ACTIVE"}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            className="field mt-2 font-normal"
          >
            <option value="ACTIVE">Active — visible in the marketplace</option>
            <option value="PAUSED">Paused — hidden, no new inquiries</option>
          </select>
        </label>

        <div className="flex gap-3 mt-7">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {initial?.id ? "Save changes" : "Publish listing"}
          </button>
          {initial?.id && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={deleting}
              className="btn btn-secondary text-rose-300 disabled:opacity-60"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
