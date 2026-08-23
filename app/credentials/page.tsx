"use client";
import AppShell from "@/components/AppShell";
import {
  Award,
  ExternalLink,
  FileCheck2,
  Loader2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Credentials() {
  const [badges, setBadges] = useState<any[]>([]),
    [certs, setCerts] = useState<any[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch("/api/badges").then((r) => (r.ok ? r.json() : { earned: [] })),
      fetch("/api/certificates").then((r) => (r.ok ? r.json() : [])),
    ]).then(([b, c]) => {
      setBadges(b.earned || []);
      setCerts(c);
      setLoading(false);
    });
  }, []);
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
            <h2 className="font-bold text-lg mt-8">Experience badges</h2>
            {badges.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {badges.map((x) => (
                  <article
                    className="project-cyber-card text-center"
                    key={x.id}
                  >
                    <span className="h-14 w-14 mx-auto rounded-2xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                      <Award size={27} />
                    </span>
                    <h3 className="font-bold mt-4">{x.badge.name}</h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {x.project?.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-3 line-clamp-3">
                      {x.evidence}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                icon={<Award />}
                title="No badges yet"
                text="Founders can award contribution badges after completed milestones."
              />
            )}
            <h2 className="font-bold text-lg mt-10">Experience certificates</h2>
            {certs.length ? (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {certs.map((c) => (
                  <article
                    className="bg-white border border-slate-200 rounded-2xl p-5"
                    key={c.id}
                  >
                    <div className="flex">
                      <span className="h-11 w-11 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                        <FileCheck2 />
                      </span>
                      <div className="ml-3">
                        <b>{c.role_title}</b>
                        <p className="text-xs text-slate-500 mt-1">
                          {c.project?.title}
                        </p>
                      </div>
                      <ShieldCheck className="ml-auto text-cyan-300" />
                    </div>
                    <p className="text-xs text-slate-500 mt-5">
                      Issued by {c.issuer?.name} ·{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/verify/${c.verification_code}`}
                        className="btn btn-secondary !py-2 text-xs"
                      >
                        <ExternalLink size={14} />
                        Verify
                      </Link>
                      <button
                        onClick={() => window.print()}
                        className="btn btn-secondary !py-2 text-xs"
                      >
                        <Printer size={14} />
                        Print / PDF
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                icon={<FileCheck2 />}
                title="No certificates yet"
                text="Certificates appear after founders verify completed project experience."
              />
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
