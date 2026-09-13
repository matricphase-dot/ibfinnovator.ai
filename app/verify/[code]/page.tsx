"use client";
import { CheckCircle2, Download, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
export default function Verify() {
  const { code } = useParams<{ code: string }>(),
    [c, setC] = useState<any>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/certificates/${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setC)
      .finally(() => setLoading(false));
  }, [code]);
  if (loading)
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-cyan-300" />
      </div>
    );
  return (
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <article className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center">
        {c ? (
          <>
            <ShieldCheck className="mx-auto text-cyan-300" size={56} />
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold mt-5">
              VERIFIED IBF EXPERIENCE
            </p>
            <h1 className="text-4xl font-black mt-3">{c.receiver?.name}</h1>
            <p className="text-slate-400 mt-3">contributed as</p>
            <h2 className="text-2xl font-bold text-cyan-300 mt-2">
              {c.role_title}
            </h2>
            <p className="text-slate-400 mt-3">
              to <b className="text-white">{c.project?.title}</b>
              {c.project?.domain && ` · ${c.project.domain}`}
            </p>
            {(c.started_at || c.completed_at) && (
              <p className="text-sm text-slate-500 mt-4">
                {c.started_at || "Start not recorded"} —{" "}
                {c.completed_at || "Present"}
              </p>
            )}
            <p className="text-sm text-slate-500 mt-5">
              Issued by <b className="text-white">{c.issuer?.name}</b>
              {c.issuer?.company && ` · ${c.issuer.company}`}
            </p>
            <div className="mt-8 p-4 rounded-xl bg-cyan-300/10 text-cyan-300 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              Authentic certificate
            </div>
            <code className="block text-xs text-slate-500 mt-5">
              Verification: {c.verification_code}
            </code>
            <div className="flex justify-center gap-3 mt-6">
              <a
                href={`/api/certificates/${c.id}/pdf`}
                target="_blank"
                className="btn btn-primary"
              >
                <Download size={16} />
                Download PDF
              </a>
              <Link href="/" className="btn btn-secondary">
                Visit IBF
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black">Certificate not found</h1>
            <p className="text-slate-500 mt-3">
              This verification code is invalid or no longer available.
            </p>
            <Link href="/" className="btn btn-primary mt-6">
              Back to IBF
            </Link>
          </>
        )}
      </article>
    </main>
  );
}
