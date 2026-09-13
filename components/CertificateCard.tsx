import { Download, ExternalLink, FileCheck2, Linkedin } from "lucide-react";
import Link from "next/link";
export default function CertificateCard({
  certificate: c,
}: {
  certificate: any;
}) {
  const verify = `/verify/${c.verification_code}`;
  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex">
        <span className="feature-icon">
          <FileCheck2 />
        </span>
        <div className="ml-3">
          <b>{c.role_title}</b>
          <p className="text-xs text-slate-500 mt-1">{c.project?.title}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Issued by {c.issuer?.name} ·{" "}
        {new Date(c.created_at).toLocaleDateString()}
      </p>
      <code className="block text-[10px] text-cyan-300 mt-3 truncate">
        {c.verification_code}
      </code>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link href={verify} className="btn btn-secondary !py-2 text-xs">
          <ExternalLink size={13} />
          Verify
        </Link>
        <a
          href={`/api/certificates/${c.id}/pdf`}
          target="_blank"
          className="btn btn-secondary !py-2 text-xs"
        >
          <Download size={13} />
          Download PDF
        </a>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com") + verify)}`}
          className="btn btn-secondary !py-2 text-xs"
        >
          <Linkedin size={13} />
          Share
        </a>
      </div>
    </article>
  );
}
