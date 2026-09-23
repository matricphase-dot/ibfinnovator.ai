"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { segment: "dashboard" },
      extra: { digest: error.digest },
    });
  }, [error]);
  return (
    <main className="p-6">
      <div className="max-w-md">
        <p className="text-[10px] tracking-[.2em] text-red-300 font-bold">DASHBOARD ERROR</p>
        <h1 className="text-2xl font-black mt-2">Couldn&apos;t load your dashboard.</h1>
        <p className="text-slate-500 mt-2 text-sm">Your navigation is intact. Retry without losing state.</p>
        <button onClick={reset} className="btn btn-primary mt-4">Retry dashboard</button>
        {error.digest && <code className="block text-[10px] text-slate-600 mt-3">Ref: {error.digest}</code>}
      </div>
    </main>
  );
}
