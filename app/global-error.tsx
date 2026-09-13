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
    <html>
      <body>
        <main
          style={{
            minHeight: "100vh",
            background: "#0a0f1e",
            color: "#f4f7fb",
            display: "grid",
            placeItems: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p>The error was recorded. Please try again.</p>
            <button
              onClick={reset}
              style={{
                padding: "12px 20px",
                background: "#00f5d4",
                border: 0,
                borderRadius: 8,
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
