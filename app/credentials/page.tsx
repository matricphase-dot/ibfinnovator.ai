"use client";

import AppShell from "@/components/AppShell";
import BadgeGrid, { type EarnedBadge } from "@/components/BadgeGrid";
import CertificateCard, { type Certificate } from "@/components/CertificateCard";
import { Award, FileCheck2, Loader2, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * Credentials: earned badges, issued certificates and reviews received.
 *
 * Badge and certificate GETs accept ?user_id=, so the same components back both
 * this page and someone else's public profile.
 */

type Tab = "badges" | "certificates" | "reviews";

export default function Credentials() {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("badges");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [profile, badgeData, certData] = await Promise.all([
      fetch("/api/profile", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/badges", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { earned: [] }))
        .catch(() => ({ earned: [] })),
      fetch("/api/certificates", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]);
    setBadges(badgeData?.earned ?? []);
    setCerts(Array.isArray(certData) ? certData : []);
    if (profile?.id) {
      const users = await fetch(`/api/users/${profile.id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      setReviews(users?.reviews ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs: [Tab, any, string, number][] = [
    ["badges", Award, "Badges", badges.length],
    ["certificates", FileCheck2, "Certificates", certs.length],
    ["reviews", Star, "Reviews received", reviews.length],
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          VERIFIED EXPERIENCE
        </p>
        <h1 className="text-3xl font-black mt-2">Credentials</h1>
        <p className="text-slate-500 mt-2">
          Badges and certificates earned through real startup contributions.
        </p>

        {loading ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mt-8" role="tablist">
              {tabs.map(([id, Icon, label, count]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`btn ${tab === id ? "btn-primary" : "btn-secondary"} !py-2 text-xs`}
                >
                  <Icon size={14} />
                  {label}
                  <span className="opacity-70">· {count}</span>
                </button>
              ))}
            </div>

            {tab === "badges" && (
              <section className="mt-6">
                <BadgeGrid badges={badges} />
                {badges.length > 0 && (
                  <p className="text-xs text-slate-500 mt-4">
                    Badges are awarded by project founders and cannot be edited.
                    Only certificates carry a public verification link.
                  </p>
                )}
              </section>
            )}

            {tab === "certificates" && (
              <section className="mt-6">
                {certs.length ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {certs.map((cert) => (
                      <CertificateCard cert={cert} key={cert.id} />
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={<FileCheck2 />}
                    title="No certificates yet"
                    text="Certificates appear after founders verify completed project experience."
                  />
                )}
              </section>
            )}

            {tab === "reviews" && (
              <section className="mt-6">
                {reviews.length ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <article
                        className="bg-white border border-slate-200 rounded-2xl p-5"
                        key={review.id}
                      >
                        <div className="flex items-start">
                          <span className="h-10 w-10 shrink-0 rounded-xl bg-amber-300/10 text-amber-500 grid place-items-center font-black">
                            {review.reviewer?.name?.slice(0, 2).toUpperCase() || "IB"}
                          </span>
                          <div className="ml-3 min-w-0">
                            <b className="text-sm">
                              {review.reviewer?.name || "IBF member"}
                            </b>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {review.project?.title ?? "Project"} ·{" "}
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="ml-auto flex text-amber-400 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                fill={review.rating >= star ? "currentColor" : "none"}
                              />
                            ))}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 leading-6 mt-4">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={<Star />}
                    title="No reviews yet"
                    text="Reviews from collaborators appear once you finish a project together."
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="mt-4 py-16 border border-dashed border-white/10 rounded-2xl text-center">
      <span className="mx-auto text-slate-600 inline-block">{icon}</span>
      <h3 className="font-bold mt-3">{title}</h3>
      <p className="text-sm text-slate-500 mt-2">{text}</p>
    </div>
  );
}
