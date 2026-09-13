"use client";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useModalA11y } from "./useModalA11y";
export default function LeaveReviewModal({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false),
    [projects, setProjects] = useState<any[]>([]),
    [rating, setRating] = useState(5),
    [loading, setLoading] = useState(false);
  const modalRef = useModalA11y(open, () => setOpen(false));
  async function loadEligibility() {
    const [connections, me] = await Promise.all([
      fetch("/api/connections").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    const related = (Array.isArray(connections) ? connections : []).filter(
      (c: any) =>
        c.status === "ACCEPTED" &&
        [c.requester_id, c.recipient_id].includes(userId) &&
        [c.requester_id, c.recipient_id].includes(me.id),
    );
    const rows = (
      await Promise.all(
        related.map((c: any) =>
          fetch(`/api/projects/${c.project_id}`).then((r) =>
            r.ok ? r.json() : null,
          ),
        ),
      )
    ).filter((p: any) => p?.status === "COMPLETED");
    setProjects(rows);
  }
  useEffect(() => {
    loadEligibility();
  }, [userId]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget),
      r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewee_id: userId,
          project_id: f.get("project_id"),
          rating,
          comment: f.get("comment"),
        }),
      }),
      d = await r.json();
    setLoading(false);
    if (r.ok) {
      toast.success("Review submitted");
      setOpen(false);
      onSuccess();
    } else toast.error(d.error || "Could not submit review");
  }
  if (!projects.length) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary">
        Leave a Review
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] bg-black/75 grid place-items-center p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex">
              <h2 id="review-title" className="text-xl font-black">
                Review collaboration
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ml-auto"
              >
                <X />
              </button>
            </div>
            {projects.length ? (
              <>
                <label className="block text-sm font-bold mt-6">
                  Completed project
                  <select required name="project_id" className="field mt-2">
                    <option value="">Select</option>
                    {projects.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-5">
                  <p className="text-sm font-bold">Rating</p>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        onClick={() => setRating(n)}
                        key={n}
                      >
                        <Star
                          className={
                            n <= rating ? "text-amber-300" : "text-slate-600"
                          }
                          fill={n <= rating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-bold mt-5">
                  Comment
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    name="comment"
                    className="field mt-2 min-h-28"
                  />
                </label>
                <button
                  disabled={loading}
                  className="btn btn-primary w-full mt-6"
                >
                  Submit review
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500 mt-6">
                You can review this user after completing a shared project.
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}
