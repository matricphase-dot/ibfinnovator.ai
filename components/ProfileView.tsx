"use client";
import AppShell from "./AppShell";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import BadgeGrid, { type EarnedBadge } from "@/components/BadgeGrid";
import CertificateCard, { type Certificate } from "@/components/CertificateCard";
import EndorseSkillButton from "@/components/EndorseSkillButton";
import LeaveReviewModal from "@/components/LeaveReviewModal";
export default function ProfileView({
  userId,
  own = false,
}: {
  userId?: string;
  own?: boolean;
}) {
  const [p, setP] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [me, setMe] = useState<any>(null),
    [badges, setBadges] = useState<EarnedBadge[]>([]),
    [certificates, setCertificates] = useState<Certificate[]>([]),
    [reviewable, setReviewable] = useState(0),
    [endorsements, setEndorsements] = useState<any[]>([]),
    [editing, setEditing] = useState<{ id: string; rating: number; comment: string } | null>(null),
    [busy, setBusy] = useState("");

  useEffect(() => {
    fetch(own ? "/api/profile" : `/api/users/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setP)
      .finally(() => setLoading(false));
  }, [userId, own]);

  // Everything below is keyed on the profile id, so it works the same for your
  // own profile and someone else's once `p` has loaded.
  const loadExtras = useCallback(async (profileId: string) => {
    const [users, badgeData, certData, meData] = await Promise.all([
      fetch(`/api/users/${profileId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/badges?user_id=${profileId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { earned: [] }))
        .catch(() => ({ earned: [] })),
      fetch(`/api/certificates?user_id=${profileId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/profile", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);
    setEndorsements(users?.endorsements ?? []);
    setBadges(badgeData?.earned ?? []);
    setCertificates(Array.isArray(certData) ? certData : []);
    setMe(meData);

    // Only show "Leave a review" when a shared COMPLETED project exists.
    if (meData?.id && meData.id !== profileId) {
      fetch(`/api/reviews/eligibility?reviewee_id=${profileId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .then((data) => setReviewable((data?.projects ?? []).length))
        .catch(() => setReviewable(0));
    }
  }, []);

  useEffect(() => {
    if (p?.id) void loadExtras(p.id);
  }, [p?.id, loadExtras]);
  // Editing and deleting are offered on contributions you authored. For a
  // review that means the profile you are looking at is the person you reviewed;
  // on your own profile the reviews shown were written by other people and are
  // not yours to change.
  async function saveReview(id: string) {
    if (!editing) return;
    if (editing.comment.trim().length < 10) return;
    setBusy(id);
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rating: editing.rating,
          comment: editing.comment.trim(),
        }),
      });
      if (response.ok) {
        setP((prev: any) => ({
          ...prev,
          reviews: prev.reviews.map((r: any) =>
            r.id === id
              ? { ...r, rating: editing.rating, comment: editing.comment.trim() }
              : r,
          ),
        }));
        setEditing(null);
        void loadExtras(p.id);
      }
    } finally {
      setBusy("");
    }
  }

  async function deleteReview(id: string) {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setBusy(id);
    try {
      const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (response.ok) {
        setP((prev: any) => ({
          ...prev,
          reviews: prev.reviews.filter((r: any) => r.id !== id),
        }));
        void loadExtras(p.id);
      }
    } finally {
      setBusy("");
    }
  }

  async function withdrawEndorsement(id: string) {
    if (!window.confirm("Withdraw this endorsement?")) return;
    setBusy(id);
    try {
      const response = await fetch(`/api/endorsements/${id}`, { method: "DELETE" });
      if (response.ok) {
        setEndorsements((prev) => prev.filter((e: any) => e.id !== id));
        void loadExtras(p.id);
      }
    } finally {
      setBusy("");
    }
  }

  const myReviews = (p?.reviews ?? []).filter(
    (review: any) => review.reviewer?.id && review.reviewer.id === me?.id,
  );
  const myEndorsements = endorsements.filter(
    (endorsement: any) => endorsement.giver?.id && endorsement.giver.id === me?.id,
  );

  if (loading)
    return (
      <AppShell>
        <div className="min-h-[70vh] grid place-items-center">
          <Loader2 className="animate-spin text-cyan-300" />
        </div>
      </AppShell>
    );
  if (!p)
    return (
      <AppShell>
        <div className="min-h-[70vh] grid place-items-center text-center">
          <div>
            <UserRound className="mx-auto text-slate-600" size={42} />
            <h1 className="text-2xl font-black mt-4">Profile not found</h1>
          </div>
        </div>
      </AppShell>
    );
  const initials =
    p.name
      ?.split(" ")
      .map((x: string) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IB";
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-5 md:p-8">
        <div className="h-44 rounded-3xl bg-gradient-to-r from-[#00f5d4] via-[#00b8ff] to-[#0a0f1e] relative overflow-hidden">
          <div className="section-grid" />
        </div>
        <div className="px-5 md:px-10">
          <div className="flex items-end -mt-12 relative">
            <span className="w-28 h-28 bg-[#101b2c] rounded-3xl border-4 border-[#0a0f1e] text-cyan-300 text-2xl font-black grid place-items-center">
              {initials}
            </span>
            <div className="ml-auto flex gap-2">
              {own && (
                <Link href="/settings" className="btn btn-primary">
                  Edit profile
                </Link>
              )}
            </div>
          </div>
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 mt-6">
            <section>
              <h1 className="text-3xl font-black flex items-center gap-2">
                {p.name}
                <CheckCircle2 className="text-cyan-300" size={21} />
              </h1>
              <p className="text-slate-400 font-semibold mt-1">
                {p.company || String(p.role).replace("_", " ")}
              </p>
              <p className="text-sm text-slate-500 flex gap-2 mt-3">
                <MapPin size={16} />
                Remote · {p.availability || "Availability not specified"}
              </p>
              <p className="text-slate-400 leading-7 mt-7">
                {p.bio || p.goals || "This IBF member has not added a bio yet."}
              </p>
              <h2 className="font-extrabold mt-8">Skills</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.skills?.length ? (
                  p.skills.map((x: string) => {
                    const forSkill = endorsements.filter(
                      (e: any) => e.skill?.toLowerCase() === x.toLowerCase(),
                    );
                    const alreadyEndorsed =
                      !!me?.id && forSkill.some((e: any) => e.giver?.id === me.id);
                    if (own || !me?.id) {
                      return (
                        <span className="pill bg-violet-50 text-violet-700" key={x}>
                          {x}
                          {forSkill.length > 0 && (
                            <span className="opacity-70">· {forSkill.length}</span>
                          )}
                        </span>
                      );
                    }
                    return (
                      <EndorseSkillButton
                        key={x}
                        receiverId={p.id}
                        skill={x}
                        count={forSkill.length}
                        endorsed={alreadyEndorsed}
                        onEndorsed={() => void loadExtras(p.id)}
                      />
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No skills added yet.</p>
                )}
              </div>

              <h2 className="font-extrabold mt-8">Badges</h2>
              <BadgeGrid badges={badges} className="mt-3" />

              {certificates.length > 0 && (
                <>
                  <h2 className="font-extrabold mt-8">Certificates</h2>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    {certificates.map((cert) => (
                      <CertificateCard cert={cert} key={cert.id} />
                    ))}
                  </div>
                </>
              )}
              <h2 className="font-extrabold mt-8">Reviews</h2>
              {p.reviews?.length ? (
                <div className="space-y-4 mt-3">
                  {p.reviews.map((review: any) => {
                    const isMine = !!me?.id && review.reviewer?.id === me.id;
                    // A local keeps the draft non-null inside the editor block;
                    // `editing?.id === review.id` alone does not narrow.
                    const draft = editing && editing.id === review.id ? editing : null;
                    const isEditing = draft !== null;
                    return (
                      <article
                        className="bg-white border border-slate-200 rounded-2xl p-5"
                        key={review.id}
                      >
                        <div className="flex items-start">
                          <span className="h-10 w-10 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center text-xs font-bold">
                            {review.reviewer?.name?.slice(0, 2).toUpperCase() || "IB"}
                          </span>
                          <div className="ml-3 min-w-0">
                            <b className="text-sm">
                              {isMine ? "You" : review.reviewer?.name || "IBF member"}
                            </b>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {review.project?.title ?? "Project"} ·{" "}
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {isMine && !isEditing && (
                            <div className="ml-auto flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditing({
                                    id: review.id,
                                    rating: review.rating,
                                    comment: review.comment ?? "",
                                  })
                                }
                                aria-label="Edit your review"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-100"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy === review.id}
                                onClick={() => void deleteReview(review.id)}
                                aria-label="Delete your review"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-50 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}

                          {!isEditing && (
                            <span className="ml-auto flex text-amber-400 shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={13}
                                  fill={review.rating >= star ? "currentColor" : "none"}
                                />
                              ))}
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-4">
                            <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  role="radio"
                                  aria-checked={draft!.rating === star}
                                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                                  onClick={() => setEditing({ ...draft!, rating: star })}
                                  className="p-1"
                                >
                                  <Star
                                    size={22}
                                    className={draft!.rating >= star ? "text-amber-400" : "text-slate-300"}
                                    fill={draft!.rating >= star ? "currentColor" : "none"}
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={draft!.comment}
                              onChange={(event) =>
                                setEditing({ ...draft!, comment: event.target.value })
                              }
                              className="field mt-3 min-h-24"
                              aria-label="Edit review comment"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                disabled={busy === review.id || draft!.comment.trim().length < 10}
                                onClick={() => void saveReview(review.id)}
                                className="btn btn-primary !py-2 text-xs disabled:opacity-50"
                              >
                                {busy === review.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : null}
                                Save changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="btn btn-secondary !py-2 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          review.comment && (
                            <p className="text-sm text-slate-600 leading-6 mt-4">
                              {review.comment}
                            </p>
                          )
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-3">
                  No reviews yet. Reviews appear once a project is completed.
                </p>
              )}

              <h2 className="font-extrabold mt-8">Interests</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.interests?.map((x: string) => (
                  <span className="tech-chip" key={x}>
                    {x}
                  </span>
                ))}
              </div>
              {p.portfolio_urls?.length > 0 && (
                <>
                  <h2 className="font-extrabold mt-8">Portfolio</h2>
                  <div className="space-y-2 mt-3">
                    {p.portfolio_urls.map((u: string) => (
                      <a
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-slate-200 rounded-xl p-4 flex items-center text-sm text-cyan-300"
                        key={u}
                      >
                        {u}
                        <ExternalLink className="ml-auto" size={15} />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </section>
            <aside>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-500">
                  IBF REPUTATION
                </p>
                <div className="flex items-center mt-3">
                  <b className="text-3xl">
                    {p.average_rating?.toFixed?.(1) || "—"}
                  </b>
                  <div className="flex text-amber-400 ml-3">
                    {[1, 2, 3, 4, 5].map((x) => (
                      <Star
                        key={x}
                        size={15}
                        fill={p.average_rating >= x ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  from {p.reviews?.length || 0} reviews
                </p>
                {!own && me?.id && reviewable > 0 && (
                  <div className="mt-4">
                    <LeaveReviewModal
                      revieweeId={p.id}
                      revieweeName={p.name}
                      onSubmitted={() => void loadExtras(p.id)}
                    />
                  </div>
                )}
                <hr className="my-5 border-slate-100" />
                <b className="text-sm">
                  {p.endorsement_count || endorsements.length || 0} skill
                  endorsements
                </b>
                <div className="flex flex-wrap gap-1 mt-3">
                  {Array.from(new Set(endorsements.map((x: any) => x.skill)))
                    .slice(0, 6)
                    .map((x: any) => (
                      <span className="tech-chip" key={x}>
                        {x}
                      </span>
                    ))}
                </div>
                {myEndorsements.length > 0 && (
                  <>
                    <hr className="my-5 border-slate-100" />
                    <b className="text-xs text-slate-500">ENDORSEMENTS YOU GAVE</b>
                    <ul className="mt-3 space-y-2">
                      {myEndorsements.map((endorsement: any) => (
                        <li
                          className="flex items-center gap-2 text-xs text-slate-600"
                          key={endorsement.id}
                        >
                          <span className="tech-chip">{endorsement.skill}</span>
                          <button
                            type="button"
                            disabled={busy === endorsement.id}
                            onClick={() => void withdrawEndorsement(endorsement.id)}
                            aria-label={`Withdraw your endorsement of ${endorsement.skill}`}
                            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-50"
                          >
                            <X size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
