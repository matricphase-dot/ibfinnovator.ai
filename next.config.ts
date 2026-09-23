import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
// ROOT FIX M1: remove `unsafe-eval` (XSS gadget), keep minimal `unsafe-inline`
// only because Clerk currently requires it for its injected scripts.
// Isolation headers (COOP/CORP/OAC) added; API routes get a separate
// minimal header set with private no-store instead of CSP noise.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.innovators-global.com https://challenges.cloudflare.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.innovators-global.com https://*.ingest.sentry.io",
  "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com https://*.clerk.com https://clerk.innovators-global.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.innovators-global.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
const pageSecurityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];
const apiSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];
const nextConfig: NextConfig = {
  images: {
    // ROOT FIX (part of M1/M5): narrow optimizer abuse surface. The Supabase
    // wildcard is required for per-project storage hosts, but AVIF/WebP +
    // long cache TTL prevents cache-poisoning bandwidth burn.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      { source: "/api/:path*", headers: apiSecurityHeaders },
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)",
        headers: pageSecurityHeaders,
      },
    ];
  },
};
const sentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_AUTH_TOKEN,
);
export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      disableLogger: true,
    })
  : nextConfig;
