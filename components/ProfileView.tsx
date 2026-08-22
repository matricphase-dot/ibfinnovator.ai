"use client";
import AppShell from "./AppShell";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function ProfileView({
  userId,
  own = false,
}: {
  userId?: string;
  own?: boolean;
}) {
  const [p, setP] = useState<any>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(own ? "/api/profile" : `/api/users/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setP)
      .finally(() => setLoading(false));
  }, [userId, own]);
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
                  p.skills.map((x: string) => (
                    <span className="pill bg-violet-50 text-violet-700" key={x}>
                      {x}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No skills added yet.</p>
                )}
              </div>
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
                <hr className="my-5 border-slate-100" />
                <b className="text-sm">
                  {p.endorsement_count || p.endorsements?.length || 0} skill
                  endorsements
                </b>
                <div className="flex flex-wrap gap-1 mt-3">
                  {Array.from(
                    new Set((p.endorsements || []).map((x: any) => x.skill)),
                  )
                    .slice(0, 6)
                    .map((x: any) => (
                      <span className="tech-chip" key={x}>
                        {x}
                      </span>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
