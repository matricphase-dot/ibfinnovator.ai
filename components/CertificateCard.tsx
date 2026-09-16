"use client";

import { ExternalLink, FileCheck2, Linkedin, Printer, ShieldCheck } from "lucide-react";
import Link from "next/link";

/**
 * A single issued certificate.
 *
 * "Download PDF" opens /verify/<code>/print, which renders a print-formatted
 * page and opens the browser print dialog — the repo has no PDF library and one
 * is not being added for this. The verification code is the capability: anyone
 * holding it can already read exactly this data from the public verify page, so
 * the print view exposes nothing new.
 */

export interface Certificate {
  id: string;
  role_title?: string;
  started_at?: string | null;
  completed_at?: string | null;
  verification_code: string;
  created_at?: string;
  project?: { id?: string; title?: string } | null;
  issuer?: { id?: string; name?: string; company?: string | null } | null;
}

export function verifyUrl(code: string): string {
  const path = `/verify/${code}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function linkedInShareUrl(code: string, title: string): string {
  const url = encodeURIComponent(verifyUrl(code));
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${encodeURIComponent(
    title,
  )}`;
}

const range = (cert: Certificate) => {
  const from = cert.started_at ? new Date(cert.started_at).toLocaleDateString() : null;
  const to = cert.completed_at ? new Date(cert.completed_at).toLocaleDateString() : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Completed ${to}`;
  return cert.created_at ? `Issued ${new Date(cert.created_at).toLocaleDateString()}` : "";
};

export default function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex">
        <span className="h-11 w-11 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
          <FileCheck2 />
        </span>
        <div className="ml-3 min-w-0">
          <b>{cert.role_title || "Contributor"}</b>
          <p className="text-xs text-slate-500 mt-1">
            {cert.project?.title ?? "Project"}
          </p>
        </div>
        <ShieldCheck className="ml-auto shrink-0 text-cyan-300" />
      </div>

      <dl className="text-xs text-slate-500 mt-5 space-y-1">
        <div className="flex gap-2">
          <dt className="font-semibold text-slate-400">Issued by</dt>
          <dd>
            {cert.issuer?.name ?? "IBF founder"}
            {cert.issuer?.company ? ` · ${cert.issuer.company}` : ""}
          </dd>
        </div>
        {range(cert) && (
          <div className="flex gap-2">
            <dt className="font-semibold text-slate-400">Duration</dt>
            <dd>{range(cert)}</dd>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <dt className="font-semibold text-slate-400">Code</dt>
          <dd className="font-mono text-[11px] break-all">{cert.verification_code}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 mt-5">
        <Link
          href={`/verify/${cert.verification_code}`}
          className="btn btn-secondary !py-2 text-xs"
        >
          <ExternalLink size={14} />
          Verify
        </Link>
        <Link
          href={`/verify/${cert.verification_code}/print`}
          target="_blank"
          className="btn btn-secondary !py-2 text-xs"
        >
          <Printer size={14} />
          Download PDF
        </Link>
        <a
          href={linkedInShareUrl(
            cert.verification_code,
            `${cert.role_title ?? "Certificate"} — ${cert.project?.title ?? "IBF"}`,
          )}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-secondary !py-2 text-xs"
        >
          <Linkedin size={14} />
          Share on LinkedIn
        </a>
      </div>
    </article>
  );
}
