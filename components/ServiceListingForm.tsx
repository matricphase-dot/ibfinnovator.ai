"use client";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useModalA11y } from "./useModalA11y";
export default function ServiceListingForm({
  service,
  onSaved,
  onClose,
}: {
  service?: any;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<string[]>(service?.skills || [""]),
    [loading, setLoading] = useState(false);
  const modalRef = useModalA11y(true, onClose);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      body = {
        title: f.get("title"),
        description: f.get("description"),
        skills: skills.map((x) => x.trim()).filter(Boolean),
        pricing_note: f.get("pricing_note"),
        availability: f.get("availability"),
      };
    setLoading(true);
    const r = await fetch(
        service ? `/api/marketplace/${service.id}` : "/api/marketplace",
        {
          method: service ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
      d = await r.json();
    setLoading(false);
    if (r.ok) {
      toast.success(service ? "Listing updated" : "Service published");
      onSaved();
      onClose();
    } else toast.error(d.error || "Could not save listing");
  }
  async function remove() {
    if (!service || !confirm("Delete this service listing?")) return;
    const r = await fetch(`/api/marketplace/${service.id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      toast.success("Listing deleted");
      onSaved();
      onClose();
    }
  }
  return (
    <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xl bg-[#111827] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-auto"
      >
        <div className="flex">
          <h2 className="text-xl font-black">
            {service ? "Edit service" : "List your service"}
          </h2>
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
          Title
          <input
            required
            minLength={3}
            maxLength={140}
            defaultValue={service?.title}
            name="title"
            className="field mt-2"
          />
        </label>
        <label className="block text-sm font-bold mt-4">
          Description (minimum 30 words)
          <textarea
            required
            defaultValue={service?.description}
            name="description"
            className="field mt-2 min-h-32"
          />
        </label>
        <div className="mt-4">
          <b className="text-sm">Skills</b>
          {skills.map((s, i) => (
            <div className="flex gap-2 mt-2" key={i}>
              <input
                className="field"
                value={s}
                onChange={(e) =>
                  setSkills(
                    skills.map((x, n) => (n === i ? e.target.value : x)),
                  )
                }
              />
              <button
                type="button"
                onClick={() => setSkills(skills.filter((_, n) => n !== i))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSkills([...skills, ""])}
            className="btn btn-secondary mt-2"
          >
            <Plus size={14} />
            Add skill
          </button>
        </div>
        <label className="block text-sm font-bold mt-4">
          Pricing note
          <input
            maxLength={200}
            defaultValue={service?.pricing_note}
            name="pricing_note"
            className="field mt-2"
            placeholder="From ₹5,000 / project"
          />
        </label>
        <label className="block text-sm font-bold mt-4">
          Availability
          <input
            maxLength={120}
            defaultValue={service?.availability}
            name="availability"
            className="field mt-2"
          />
        </label>
        <div className="flex mt-6">
          {service && (
            <button
              type="button"
              onClick={remove}
              className="btn btn-secondary text-red-300"
            >
              Delete
            </button>
          )}
          <button disabled={loading} className="btn btn-primary ml-auto">
            {loading ? "Saving…" : "Save listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
