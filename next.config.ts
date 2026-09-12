import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

// DEMO_MODE: offline demo used in the sandbox preview. The sandbox network
// blocks clerk.com and supabase.co, so Clerk components and the Supabase
// client are swapped for local in-memory shims (see /mock). Everything else
// (middleware, API routes, matching, onboarding) runs the real app code.
// Never enable DEMO_MODE in production — it bypasses real authentication.
if (process.env.DEMO_MODE === "true") {
  console.warn(
    "⚠ DEMO_MODE is ON — Clerk auth and Supabase are replaced by local stubs. Never use this in production.",
  );
  nextConfig.webpack = (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clerk/nextjs$": path.resolve(__dirname, "mock/clerk-client.tsx"),
      "@clerk/nextjs/server$": path.resolve(__dirname, "mock/clerk-server.ts"),
    };
    return config;
  };
}

export default nextConfig;
