"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Print / save-as-PDF view of a certificate.
 *
 * The repo has no PDF library and none is being added, so this is the
 * "HTML -> print" fallback: a print-styled page that opens the browser's print
 * dialog, where "Save as PDF" produces the file.
 *
 * Keyed by verification code and deliberately public: that code is already the
 * capability that grants read access to exactly this data through
 * /api/certificates/<code>, so a member can print their own certificate and a
 * recruiter holding the code can print the one they are verifying.
 *
 * The QR is generated locally with the `qrcode` package — no third-party image
 * service, so the verification URL is never sent anywhere.
 */

export default function CertificatePrint() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<any>(null);
  const [qr, setQr] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!code) return;
    let alive = true;
    fetch(`/api/certificates/${code}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (!alive) return;
        if (!data) {
          setState("missing");
          return;
        }
        setCert(data);
        setState("ready");
        try {
          const QRCode = (await import("qrcode")).default;
          const url = `${window.location.origin}/verify/${data.verification_code}`;
          setQr(
            await QRCode.toDataURL(url, {
              margin: 1,
              width: 220,
              color: { dark: "#0a0f1e", light: "#ffffff" },
            }),
          );
        } catch {
          // Printing still works without the QR.
        }
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [code]);

  // Open the print dialog once the certificate is on screen.
  useEffect(() => {
    if (state !== "ready") return;
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === "loading") {
    return <main className="p-16 text-center text-slate-500">Preparing certificate…</main>;
  }

  if (state === "missing") {
    return (
      <main className="p-16 text-center">
        <h1 className="text-2xl font-black">Certificate not found</h1>
        <Link href="/" className="btn btn-secondary mt-4">
          Back home
        </Link>
      </main>
    );
  }

  const from = cert.started_at ? new Date(cert.started_at).toLocaleDateString() : null;
  const to = cert.completed_at ? new Date(cert.completed_at).toLocaleDateString() : null;
  const duration = from && to ? `${from} — ${to}` : from || to || "Verified contribution";

  return (
    <main className="min-h-screen bg-white text-slate-900 p-6 print:p-0">
      <div className="mx-auto max-w-3xl border-[6px] border-double border-slate-900 p-10 print:border-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[.3em] font-black text-slate-500">
              IBF INNOVATOR
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Verified contribution record
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-slate-900 text-white grid place-items-center font-black">
            IBF
          </span>
        </header>

        <hr className="my-8 border-slate-300" />

        <p className="text-[11px] tracking-[.3em] font-bold text-slate-500 text-center">
          CERTIFICATE OF CONTRIBUTION
        </p>
        <h1 className="text-4xl font-black text-center mt-4">
          {cert.receiver?.name || "IBF member"}
        </h1>
        <p className="text-center text-slate-600 mt-4">
          served as{" "}
          <b className="text-slate-900">{cert.role_title || "Contributor"}</b>
        </p>
        <h2 className="text-2xl font-bold text-center mt-3">
          {cert.project?.title || "Project"}
        </h2>
        <p className="text-center text-sm text-slate-500 mt-3">{duration}</p>

        <div className="flex items-end justify-between mt-14">
          <div className="text-left">
            <div className="w-52 border-b border-slate-400" />
            <p className="text-sm font-bold mt-2">
              {cert.issuer?.name || "IBF Founder"}
            </p>
            <p className="text-xs text-slate-500">Issuer · Founder</p>
          </div>

          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR code linking to the verification page for ${cert.verification_code}`} className="w-28 h-28" />
          ) : (
            <div className="w-28 h-28 border border-dashed border-slate-300 grid place-items-center text-[10px] text-slate-400 text-center p-2">
              QR code
            </div>
          )}
        </div>

        <footer className="mt-10 border-t border-slate-300 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Verify at /verify/{cert.verification_code}
          </p>
          <p className="font-mono text-xs text-slate-700 mt-1 break-all">
            {cert.verification_code}
          </p>
        </footer>
      </div>

      <div className="mx-auto max-w-3xl flex justify-center gap-3 mt-6 print:hidden">
        <button onClick={() => window.print()} className="btn btn-primary">
          <Printer size={15} />
          Print / Save as PDF
        </button>
        <Link href={`/verify/${cert.verification_code}`} className="btn btn-secondary">
          Back to verification
        </Link>
      </div>
    </main>
  );
}
