"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

function getNext(): string {
  try {
    const raw = new URLSearchParams(window.location.search).get("next");
    if (!raw) return "/dashboard";
    const t = raw.trim();
    if (
      !t.startsWith("/") ||
      t.startsWith("//") ||
      t.includes("\\") ||
      t.includes("://")
    )
      return "/dashboard";
    return t;
  } catch {
    return "/dashboard";
  }
}

/**
 * ROOT (Supabase-only): email/password + Google + LinkedIn (OIDC).
 * Hallmark Editorial UI redesign: warm paper canvas, Fraunces serif masthead,
 * high-contrast accessible typography, 2px radius tokens.
 */
export default function SignInPage() {
  const [loading, setLoading] = useState<"email" | "google" | "linkedin" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const err = new URLSearchParams(window.location.search).get("error");
      if (err) setError(decodeURIComponent(err));
    } catch {}
  }, []);

  async function oauth(provider: "google" | "linkedin_oidc") {
    setLoading(provider === "google" ? "google" : "linkedin");
    setError("");
    try {
      const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNext())}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "OAuth sign-in failed");
      setLoading(null);
    }
  }

  async function email(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading("email");
    setError("");
    const f = new FormData(e.currentTarget);
    const emailVal = String(f.get("email") || "").trim();
    const passwordVal = String(f.get("password") || "");
    try {
      const { error } = await getSupabaseBrowser().auth.signInWithPassword({
        email: emailVal,
        password: passwordVal,
      });
      if (error) throw error;
      window.location.assign(getNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--base)] text-[var(--ink)] flex flex-col justify-between p-6 sm:p-8">
      {/* Top masthead branding */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight hover:opacity-85 transition"
        >
          IBF
        </Link>
        <span className="font-mono-eyebrow text-[10px]">INNOVATOR BRIDGE FOUNDRY</span>
      </header>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] p-7 sm:p-9 shadow-xs">
          <p className="font-mono-eyebrow text-[10px] text-[var(--muted)]">SECURE SIGN IN</p>
          <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
            Sign in to IBF
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            Access your projects, team workspace, and milestone credentials.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              onClick={() => oauth("google")}
              disabled={loading !== null}
              className="btn w-full bg-[var(--base)] border-[var(--hairline)] hover:border-[var(--ink)] text-xs font-medium gap-2 disabled:opacity-50"
            >
              {loading === "google" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Google
            </button>
            <button
              type="button"
              onClick={() => oauth("linkedin_oidc")}
              disabled={loading !== null}
              className="btn w-full bg-[var(--base)] border-[var(--hairline)] hover:border-[var(--ink)] text-xs font-medium gap-2 disabled:opacity-50"
            >
              {loading === "linkedin" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.95 0-1.72-.77-1.72-1.72s.77-1.72 1.72-1.72 1.72.77 1.72 1.72-.77 1.72-1.72 1.72m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                </svg>
              )}
              LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-[var(--hairline)]" />
            <span className="font-mono-eyebrow text-[10px] text-[var(--muted)]">OR EMAIL</span>
            <span className="h-px flex-1 bg-[var(--hairline)]" />
          </div>

          <form onSubmit={email} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                Email address
              </label>
              <input
                id="signin-email"
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="field mt-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="signin-password" className="text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[var(--accent)] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="signin-password"
                name="password"
                required
                minLength={8}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="field mt-1.5"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FDF1EE] border border-[#F2C5BC] rounded-[2px] text-xs text-[#9C3826] leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading !== null}
              className="btn-editorial w-full mt-6 text-sm font-medium disabled:opacity-50"
            >
              {loading === "email" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/signup" className="text-[var(--accent)] font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer colophon */}
      <footer className="w-full max-w-md mx-auto text-center text-xs text-[var(--muted)] pt-4">
        © 2026 Innovator Bridge Foundry · Secure authentication via Supabase
      </footer>
    </main>
  );
}
