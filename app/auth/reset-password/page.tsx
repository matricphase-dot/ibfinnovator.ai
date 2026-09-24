"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") || "");
    const confirm = String(f.get("confirm") || "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await getSupabaseBrowser().auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
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
        <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] p-7 sm:p-9 shadow-xs">
          <p className="font-mono-eyebrow text-[10px] text-[var(--muted)]">ACCOUNT SECURITY</p>
          <h1 className="editorial-title text-2xl sm:text-3xl mt-2 text-[var(--ink)]">
            Create new password
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
            Choose a secure password of at least 8 characters for your workspace account.
          </p>

          {success ? (
            <div className="mt-6 border-t border-[var(--hairline)] pt-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--base)] border border-[var(--hairline)] text-[var(--accent)] mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="font-display text-xl font-medium text-[var(--ink)]">
                Password updated
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Your password has been changed successfully. You can now access your workspace.
              </p>
              <div className="pt-4 border-t border-[var(--hairline)]">
                <Link href="/dashboard" className="btn-editorial w-full text-sm">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="new-password"
                    name="password"
                    required
                    minLength={8}
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3.5 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-mono font-medium tracking-wide uppercase text-[var(--ink)]">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
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
                disabled={loading}
                className="btn-editorial w-full mt-6 text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Updating password…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Lock size={15} /> Update password
                  </span>
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
