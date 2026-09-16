"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for everything inside the app shell.
 *
 * Rendering a designed screen here matters more than it looks: without it a
 * thrown error shows Next.js's default page, which is unbranded and offers the
 * visitor nothing to do. `reset()` re-renders the segment, so a transient
 * failure does not force a full reload.
 *
 * The digest is Next.js's server-side correlation id — it is safe to show and
 * is the one detail that makes a bug report actionable before Batch 8's error
 * tracking lands.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in app segment:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <span className="h-14 w-14 rounded-2xl bg-rose-400/10 text-rose-300 grid place-items-center mx-auto">
        <AlertTriangle size={26} />
      </span>
      <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold mt-7">
        SOMETHING BROKE
      </p>
      <h1 className="text-3xl font-black mt-2">This page hit an error</h1>
      <p className="text-slate-500 mt-3">
        Your data is safe. Try again — if it keeps happening, report the
        reference below and we will trace it.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCcw size={15} />
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          Go to dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="text-[11px] text-slate-500 font-mono mt-8">
          reference: {error.digest}
        </p>
      )}
    </div>
  );
}
