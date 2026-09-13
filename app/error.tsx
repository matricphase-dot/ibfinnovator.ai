"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-[10px] tracking-[.2em] text-red-300 font-bold">
          APPLICATION ERROR
        </p>
        <h1 className="text-3xl font-black mt-3">Something went wrong.</h1>
        <p className="text-slate-500 mt-3">
          The error was recorded. You can retry without losing the current page.
        </p>
        <button onClick={reset} className="btn btn-primary mt-6">
          Try again
        </button>
        {error.digest && (
          <code className="block text-[10px] text-slate-600 mt-4">
            Reference: {error.digest}
          </code>
        )}
      </div>
    </main>
  );
}
