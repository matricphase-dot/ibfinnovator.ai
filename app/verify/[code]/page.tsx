"use client";

import { CheckCircle2, Loader2, Printer, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Public certificate verification. Anyone holding the code can confirm the
 * certificate without signing in — that is the point of the page — so it reads
 * from the public /api/certificates/<code> endpoint.
 */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-left py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 min-w-0 break-words">{value}</span>
    </div>
  );
}

export default function Verify() {
  const { code } = useParams<{ code: string }>();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/certificates/${code}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setC)
      .catch(() => setC(null))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-cyan-300" />
      </main>
    );
  }

  if (!c) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <article className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <XCircle className="mx-auto text-slate-300" size={48} />
          <h1 className="text-2xl font-black mt-5">Certificate not found</h1>
          <p className="text-slate-500 mt-2">
            This verification code is invalid or the certificate was withdrawn.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Back home
          </Link>
        </article>
      </main>
    );
  }

  const from = c.started_at ? new Date(c.started_at).toLocaleDateString() : null;
  const to = c.completed_at ? new Date(c.completed_at).toLocaleDateString() : null;
  const duration = from && to ? `${from} – ${to}` : from || to || null;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <article className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8">
        <div className="text-center">
          <ShieldCheck className="mx-auto text-cyan-300" size={48} />
          <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold mt-5">
            VERIFIED IBF EXPERIENCE
          </p>
          <h1 className="text-3xl font-black mt-3">{c.receiver?.name}</h1>
          <p className="text-slate-400 mt-2">
            served as <b className="text-slate-900">{c.role_title}</b>
          </p>
          <h2 className="text-xl font-bold mt-4">{c.project?.title}</h2>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-100 p-4">
          <Row label="Issued by" value={c.issuer?.name || "IBF Founder"} />
          {c.issuer?.company && <Row label="Organisation" value={c.issuer.company} />}
          {c.project?.domain && <Row label="Domain" value={c.project.domain} />}
          {duration && <Row label="Duration" value={duration} />}
          <Row
            label="Issued on"
            value={new Date(c.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <Row label="Verification" value={c.verification_code} />
        </div>

        <div className="mt-7 p-3 rounded-xl bg-cyan-300/10 text-cyan-700 flex items-center justify-center gap-2">
          <CheckCircle2 size={17} />
          Authentic certificate
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link
            href={`/verify/${c.verification_code}/print`}
            target="_blank"
            className="btn btn-primary"
          >
            <Printer size={15} />
            Download PDF
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </article>
    </main>
  );
}
