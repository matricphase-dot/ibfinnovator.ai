"use client";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useModalA11y } from "./useModalA11y";
export default function EventForm({
  event,
  onSaved,
  onClose,
}: {
  event?: any;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const modalRef = useModalA11y(true, onClose);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      body = {
        title: f.get("title"),
        description: f.get("description"),
        event_type: f.get("event_type"),
        starts_at: new Date(String(f.get("starts_at"))).toISOString(),
        ends_at: f.get("ends_at")
          ? new Date(String(f.get("ends_at"))).toISOString()
          : undefined,
        location: f.get("location"),
        capacity: f.get("capacity") ? Number(f.get("capacity")) : undefined,
      },
      r = await fetch(event ? `/api/events/${event.id}` : "/api/events", {
        method: event ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) {
      toast.success(event ? "Event updated" : "Event published");
      onSaved();
      onClose();
    } else toast.error(d.error || "Could not save event");
  }
  async function remove() {
    if (event && confirm("Delete this event?")) {
      await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    }
  }
  return (
    <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xl bg-[#111827] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex">
          <h2 className="text-xl font-black">
            {event ? "Edit event" : "Host an event"}
          </h2>
          <button type="button" onClick={onClose} className="ml-auto">
            <X />
          </button>
        </div>
        <label className="block text-sm font-bold mt-5">
          Title
          <input
            required
            minLength={3}
            maxLength={160}
            name="title"
            defaultValue={event?.title}
            className="field mt-2"
          />
        </label>
        <label className="block text-sm font-bold mt-4">
          Description
          <textarea
            name="description"
            maxLength={3000}
            defaultValue={event?.description}
            className="field mt-2 min-h-24"
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <label className="text-sm font-bold">
            Type
            <select
              name="event_type"
              defaultValue={event?.event_type || "EVENT"}
              className="field mt-2"
            >
              <option>EVENT</option>
              <option>AMA</option>
              <option>WORKSHOP</option>
              <option>DEMO_DAY</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              defaultValue={event?.capacity}
              className="field mt-2"
            />
          </label>
          <label className="text-sm font-bold">
            Starts
            <input
              required
              name="starts_at"
              type="datetime-local"
              className="field mt-2"
            />
          </label>
          <label className="text-sm font-bold">
            Ends
            <input
              name="ends_at"
              type="datetime-local"
              className="field mt-2"
            />
          </label>
        </div>
        <label className="block text-sm font-bold mt-4">
          Location or URL
          <input
            name="location"
            maxLength={500}
            defaultValue={event?.location}
            className="field mt-2"
          />
        </label>
        <div className="flex mt-6">
          {event && (
            <button
              type="button"
              onClick={remove}
              className="btn btn-secondary text-red-300"
            >
              Delete
            </button>
          )}
          <button disabled={loading} className="btn btn-primary ml-auto">
            {loading ? "Saving…" : "Save event"}
          </button>
        </div>
      </form>
    </div>
  );
}
