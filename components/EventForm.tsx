"use client";

import { CalendarPlus, Loader2, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Host or edit an event. Pass `initial` to edit, omit it to create.
 *
 * <input type="datetime-local"> speaks local wall-clock time while the API
 * stores UTC ISO strings, so both directions are converted explicitly — the
 * helpers below are the only place that conversion happens.
 */

export type CommunityEvent = {
  id?: string;
  title: string;
  description?: string | null;
  event_type?: string;
  starts_at?: string;
  ends_at?: string | null;
  location?: string | null;
  capacity?: number | null;
  status?: string;
};

const EMPTY: CommunityEvent = {
  title: "",
  description: "",
  event_type: "EVENT",
  location: "",
};

/** UTC ISO -> the `YYYY-MM-DDTHH:mm` shape a datetime-local input expects. */
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EventForm({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: CommunityEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CommunityEvent>(EMPTY);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = initial ?? EMPTY;
    setForm(source);
    setStartsAt(toLocalInput(source.starts_at));
    setEndsAt(toLocalInput(source.ends_at));
    setCapacity(source.capacity ? String(source.capacity) : "");
  }, [open, initial]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.title.trim().length < 3) {
      toast.error("Give the event a title of at least 3 characters.");
      return;
    }
    if (!startsAt) {
      toast.error("Pick a start date and time.");
      return;
    }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      toast.error("The end time must be after the start time.");
      return;
    }

    setSaving(true);
    try {
      const editing = Boolean(initial?.id);
      const response = await fetch(
        editing ? `/api/events/${initial!.id}` : "/api/events",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description?.trim() || null,
            event_type: form.event_type || "EVENT",
            starts_at: new Date(startsAt).toISOString(),
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            location: form.location?.trim() || null,
            capacity: capacity ? Number(capacity) : null,
          }),
        },
      );
      const payload = await response.json();
      if (response.ok) {
        toast.success(editing ? "Event updated" : "Event published");
        onSaved();
        onClose();
      } else {
        toast.error(payload.error || "Could not save this event");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this event? RSVPs are removed too.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${initial.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Event deleted");
        onSaved();
        onClose();
      } else {
        toast.error(payload.error || "Could not delete this event");
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
        onSubmit={submit}
        className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto"
      >
        <div className="flex">
          <div>
            <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
              IBF COMMUNITY
            </p>
            <h2 className="text-xl font-black mt-1">
              {initial?.id ? "Edit your event" : "Host an event"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event form"
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
            placeholder="Founder office hours: pricing"
            maxLength={160}
            required
          />
        </label>

        <label className="block text-sm font-bold mt-4">
          Description
          <textarea
            value={form.description ?? ""}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="field mt-2 font-normal min-h-24"
            placeholder="What will happen, who should come, and what to bring."
            maxLength={3000}
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="block text-sm font-bold">
            Type
            <select
              value={form.event_type ?? "EVENT"}
              onChange={(event) => setForm({ ...form, event_type: event.target.value })}
              className="field mt-2 font-normal"
            >
              <option value="EVENT">Event</option>
              <option value="AMA">AMA</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="DEMO_DAY">Demo day</option>
            </select>
          </label>
          <label className="block text-sm font-bold">
            Capacity
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="field mt-2 font-normal"
              placeholder="Leave empty for unlimited"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="block text-sm font-bold">
            Starts at
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="field mt-2 font-normal"
              required
            />
          </label>
          <label className="block text-sm font-bold">
            Ends at
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="field mt-2 font-normal"
            />
          </label>
        </div>

        <label className="block text-sm font-bold mt-4">
          Location
          <input
            value={form.location ?? ""}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            className="field mt-2 font-normal"
            placeholder="Online or a venue"
            maxLength={500}
          />
        </label>

        <div className="flex gap-3 mt-7">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
            {initial?.id ? "Save changes" : "Publish event"}
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
