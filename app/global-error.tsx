"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: this catches errors thrown by the root layout itself,
 * so it must render its own <html> and <body> and cannot rely on any of the
 * app's providers (Clerk, the toaster, AppShell) being mounted.
 *
 * Styling is therefore inline and self-contained rather than Tailwind-driven,
 * because globals.css may not have loaded when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal error in root layout:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0f1e",
          color: "#f4f7fb",
          fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: ".2em",
              fontWeight: 700,
              color: "#00f5d4",
              margin: 0,
            }}
          >
            IBF
          </p>
          <h1 style={{ fontSize: 30, margin: "0.75rem 0 0", letterSpacing: "-.02em" }}>
            The app failed to start
          </h1>
          <p style={{ color: "#8290a4", marginTop: "0.85rem", lineHeight: 1.6 }}>
            This is a platform-level failure, not something you did. Reloading
            usually clears it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              cursor: "pointer",
              border: 0,
              borderRadius: 10,
              padding: ".72rem 1.1rem",
              fontWeight: 700,
              background: "#00f5d4",
              color: "#03110f",
            }}
          >
            Reload the app
          </button>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#647287",
                marginTop: "2rem",
              }}
            >
              reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
