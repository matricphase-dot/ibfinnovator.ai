"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await getSupabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--base)] text-[var(--ink)] flex flex-col justify-between p-6 sm:p-8">
      <header className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight hover:opacity-85 transition"
        >
          IBF
        </Link>
        <span className="font-mono-eyebrow text-[10px]">INNOVATOR BRIDGE FOUNDRY</span>
      </header>

      <div className="w-full max-w-md mx-auto my-8">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--ink)] transition mb-6"
        >
          <ArrowLeft size={14} /> Back to Sign in
        </Link>

        <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] p-7 sm:p-9 shadow-xs">
          <p className="font-mono-eyebrow text-[10px] text-[var(--muted)]">ACCOUNT RECOVERY</p>
          <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
            Reset password
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            Enter your account email and we will send you a secure link to create a new password.
          </p>

          {sent ? (
            <div className="mt-6 border-t border-[var(--hairline)] pt-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--base)] border border-[var(--hairline)] text-[var(--accent)] mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="font-display text-xl font-medium text-[var(--ink)]">
                Check your email
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We sent a password reset link to <strong className="text-[var(--ink)]">{email}</strong>. Please check your inbox and spam folder.
              </p>
              <div className="pt-4 border-t border-[var(--hairline)] flex flex-col gap-3">
                <Link href="/auth/signin" className="btn-editorial w-full text-sm">
                  Return to Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline pt-1"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="recovery-email" className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                  Account Email
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="recovery-email"
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="field pr-10"
                  />
                  <Mail size={16} className="absolute right-3.5 top-3.5 text-[var(--muted)] pointer-events-none" />
                </div>
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
                disabled={loading || !email}
                className="btn-editorial w-full mt-6 text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </span>
                ) : (
                  "Send reset instructions"
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="w-full max-w-md mx-auto text-center text-xs text-[var(--muted)] pt-4">
        © 2026 Innovator Bridge Foundry · Secure authentication via Supabase
      </footer>
    </main>
  );
}
