"use client";
import { Award, Loader2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useModalA11y } from "./useModalA11y";
type Person = { id: string; name: string };
export default function AwardBadgeModal({
  projectId,
  disabled = false,
}: {
  projectId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [people, setPeople] = useState<Person[]>([]),
    [badges, setBadges] = useState<any[]>([]),
    [loading, setLoading] = useState(false);
  const modalRef = useModalA11y(open, () => setOpen(false));
  async function show() {
    if (disabled) return;
    setOpen(true);
    const [connections, b, me] = await Promise.all([
      fetch("/api/connections").then((r) => r.json()),
      fetch("/api/badges").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    const map = new Map<string, Person>();
    (Array.isArray(connections) ? connections : [])
      .filter((c: any) => c.project_id === projectId && c.status === "ACCEPTED")
      .forEach((c: any) => {
        [c.requester, c.recipient]
          .filter((p: any) => p && p.id !== me.id)
          .forEach((p: any) => map.set(p.id, p));
      });
    setPeople([...map.values()]);
    setBadges(b.definitions || []);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/badges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          receiver_id: f.get("receiver_id"),
          badge_id: f.get("badge_id"),
          evidence: f.get("evidence"),
        }),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) {
      toast.success("Badge awarded");
      setOpen(false);
    } else toast.error(d.error || "Could not award badge");
  }
  return (
    <>
      <button
        disabled={disabled}
        title={disabled ? "No accepted collaborators yet" : undefined}
        onClick={show}
        className="btn btn-secondary disabled:opacity-40"
      >
        <Award size={16} />
        Award Badge
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex">
              <h2 id="award-title" className="text-xl font-black">
                Award contribution badge
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
              Badge
              <select required name="badge_id" className="field mt-2">
                <option value="">Select</option>
                {badges.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold mt-4">
              Evidence
              <textarea
                required
                minLength={20}
                maxLength={2000}
                name="evidence"
                className="field mt-2 min-h-28"
                placeholder="Describe the contribution and completed work."
              />
            </label>
            <button disabled={loading} className="btn btn-primary w-full mt-6">
              {loading && <Loader2 className="animate-spin" size={16} />}Award
              badge
            </button>
          </form>
        </div>
      )}
    </>
  );
}
