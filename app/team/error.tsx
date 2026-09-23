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
      tags: { segment: "team" },
      extra: { digest: error.digest },
    });
  }, [error]);
  return (
    <main className="p-6">
      <div className="max-w-md">
        <p className="text-[10px] tracking-[.2em] text-red-300 font-bold">TEAM ERROR</p>
        <h1 className="text-2xl font-black mt-2">Couldn&apos;t load this team room.</h1>
        <button onClick={reset} className="btn btn-primary mt-4">Retry team</button>
        {error.digest && <code className="block text-[10px] text-slate-600 mt-3">Ref: {error.digest}</code>}
      </div>
    </main>
  );
}
