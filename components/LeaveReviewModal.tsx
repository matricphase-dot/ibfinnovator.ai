"use client";

import { Loader2, Star, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import toast from "react-hot-toast";

/**
 * Review a collaborator. The project list comes from the eligibility endpoint,
 * so only projects both members took part in *and* that are COMPLETED can be
 * selected — the same rule the API enforces.
 */

export default function LeaveReviewModal({
  revieweeId,
  revieweeName,
  onSubmitted,
}: {
  revieweeId: string;
  revieweeName?: string;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/reviews/eligibility?reviewee_id=${revieweeId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((data) => {
        const list = data?.projects ?? [];
        setProjects(list);
        if (list.length === 1) setProjectId(list[0].id);
      })
      .catch(() => {});
  }, [open, revieweeId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating) {
      toast.error("Choose a rating from 1 to 5 stars.");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Please add at least 10 characters of feedback.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewee_id: revieweeId,
          project_id: projectId,
          rating,
          comment: comment.trim(),
        }),
      });
      const payload = await response.json();
      if (response.ok) {
        toast.success("Review submitted");
        setOpen(false);
        setRating(0);
        setComment("");
        onSubmitted?.();
      } else if (response.status === 409) {
        toast.error(payload.error || "You already reviewed this person for that project.");
      } else if (response.status === 403) {
        toast.error(payload.error || "You cannot review this person.");
      } else {
        toast.error(payload.error || "Could not submit review");
      }
    } catch {
      toast.error("Unable to reach the server");
    } finally {
      setLoading(false);
    }
  }

  const dialogRef = useModalA11y<HTMLFormElement>(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary w-full"
      >
        <Star size={15} />
        Leave a review
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4">
          <form
            onSubmit={submit}
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl p-6 text-left max-h-[90vh] overflow-auto"
          >
            <div className="flex">
              <div>
                <p className="text-[9px] tracking-widest text-cyan-300 font-bold">
                  SHARED EXPERIENCE
                </p>
                <h2 className="text-xl font-black mt-1">
                  Review {revieweeName || "this member"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close review dialog"
                className="ml-auto text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-slate-400 mt-6">
                You can review this member once you have both completed a project
                together.
              </p>
            ) : (
              <>
                <label className="block text-sm font-bold mt-6">
                  Project
                  <select
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    required
                    className="field mt-2"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4">
                  <span className="block text-sm font-bold">Rating</span>
                  <div className="flex gap-1 mt-2" role="radiogroup" aria-label="Rating out of 5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="p-1"
                      >
                        <Star
                          size={26}
                          className={
                            (hover || rating) >= star
                              ? "text-amber-400"
                              : "text-slate-600"
                          }
                          fill={(hover || rating) >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm font-bold mt-4">
                  Feedback
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    required
                    minLength={10}
                    maxLength={2000}
                    className="field mt-2 min-h-28"
                    placeholder="What was it like working together? Be specific and fair."
                  />
                </label>

                <button
                  disabled={loading || !projectId || !rating || comment.trim().length < 10}
                  className="btn btn-primary w-full mt-6"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                  {loading ? "Submitting…" : "Submit review"}
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
