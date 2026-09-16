import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * Deliberately no Content-Security-Policy here: this app loads Clerk, Supabase,
 * Google Fonts and remote images, and a wrong CSP silently breaks sign-in in
 * production. A correct one has to be built against the deployed app with
 * `Content-Security-Policy-Report-Only` first, so that is left as a deliberate
 * follow-up rather than guessed at.
 */
const securityHeaders = [
  // Stops the browser second-guessing declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Full URL stays same-origin; other origins see the origin only.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clickjacking: same-origin framing only (the print view relies on this).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Nothing in the product needs these device APIs, so they stay closed.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Two years, subdomains included. Only honoured over HTTPS, which is all
  // Vercel serves, so it is safe to send unconditionally.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Avatars and project logos live in Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
