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
    [me, setMe] = useState<any>(null),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const current = await fetch("/api/profile").then((r) =>
        r.ok ? r.json() : null,
      );
      setMe(current);
      const id = own ? current?.id : userId;
      if (id) {
        const full = await fetch(`/api/users/${id}`).then((r) =>
          r.ok ? r.json() : current,
        );
        setP(full);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
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
        .toUpperCase() || "IB",
    counts = (p.endorsements || []).reduce(
      (a: any, e: any) => ((a[e.skill] = (a[e.skill] || 0) + 1), a),
      {},
    ),
    isOwn = own || me?.id === p.id;
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="h-44 rounded-3xl bg-gradient-to-r from-[#00f5d4] via-[#00b8ff] to-[#0a0f1e] relative overflow-hidden">
          <div className="section-grid" />
        </div>
        <div className="px-3 md:px-8">
          <div className="flex items-end -mt-12 relative">
            <span className="w-28 h-28 rounded-3xl border-4 border-[#0a0f1e] bg-[#101b2c] text-cyan-300 text-2xl font-black grid place-items-center overflow-hidden">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={`${p.name} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
            <div className="ml-auto flex gap-2">
              {isOwn ? (
                <Link href="/settings" className="btn btn-primary">
                  Edit Profile
                </Link>
              ) : null}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black">{p.name}</h1>
              <span className="pill bg-cyan-300/10 text-cyan-300">
                {String(p.role).replace("_", " ")}
              </span>
              <CheckCircle2 className="text-cyan-300" size={20} />
            </div>
            {p.username && (
              <p className="text-cyan-300 text-sm mt-1">@{p.username}</p>
            )}
            <p className="text-slate-400 font-semibold mt-1">
              {p.company || "Innovator member"}
            </p>
            <p className="text-sm text-slate-500 flex gap-2 mt-3">
              <MapPin size={16} />
              Remote · {p.availability || "Availability not specified"}
            </p>
          </div>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
            <main>
              <Section title="About">
                <p className="text-slate-400 leading-7">
                  {p.bio || p.goals || "This member has not added a bio yet."}
                </p>
              </Section>
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {p.skills?.length ? (
                    p.skills.map((skill: string) => (
                      <span
                        className="pill bg-violet-50 text-violet-700 gap-2"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <Empty text="No skills added yet." />
                  )}
                </div>
              </Section>
              <Section title="Portfolio">
                {p.portfolio_urls?.length ? (
                  <div className="space-y-2">
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
                ) : (
                  <Empty text="No portfolio links yet." />
                )}
              </Section>
            </main>
            <aside className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-500">
                  INNOVATORS MEMBER
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  Verified member of the Innovators startup ecosystem.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="font-extrabold text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="text-sm text-slate-500 p-4 border border-dashed border-white/10 rounded-xl">
      {text}
    </p>
  );
}
