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
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-300 transition mb-6"
        >
          <ArrowLeft size={16} /> Back to Sign in
        </Link>

        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold uppercase">Account Recovery</p>
        <h1 className="text-3xl font-black mt-2 text-white">Reset your password</h1>
        <p className="text-sm text-slate-400 mt-2">
          Enter the email associated with your IBF account and we will send you a secure link to reset your password.
        </p>

        {sent ? (
          <div className="bg-[#0d1422] border border-cyan-300/20 rounded-2xl p-6 mt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-300/10 text-cyan-300 mx-auto grid place-items-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Check your email</h2>
            <p className="text-sm text-slate-400 mt-2">
              We sent a password reset link to <b className="text-cyan-300">{email}</b>. Please check your inbox and spam folder.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/auth/signin" className="btn btn-primary w-full">
                Return to Sign in
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Try another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
            <label className="block text-sm font-bold text-slate-900">
              Account Email
              <div className="relative mt-2">
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="field pr-10 text-slate-900"
                />
                <Mail size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </label>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button
              disabled={loading || !email}
              className="btn btn-primary w-full mt-6 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send reset instructions
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
