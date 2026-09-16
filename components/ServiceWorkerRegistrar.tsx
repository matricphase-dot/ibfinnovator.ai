"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, and only in production.
 *
 * In development a worker caches aggressively between hot reloads and produces
 * bugs that do not exist in real builds, so it is skipped there. Registration
 * failure is non-fatal — the app works fine without offline support.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
