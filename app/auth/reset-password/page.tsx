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
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="w-full max-w-md">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold uppercase">SECURITY</p>
        <h1 className="text-3xl font-black mt-2 text-white">Create new password</h1>
        <p className="text-sm text-slate-400 mt-2">
          Choose a strong, unique password with at least 8 characters to secure your account.
        </p>

        {success ? (
          <div className="bg-[#0d1422] border border-cyan-300/20 rounded-2xl p-6 mt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-300/10 text-cyan-300 mx-auto grid place-items-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Password Updated!</h2>
            <p className="text-sm text-slate-400 mt-2">
              Your password has been changed successfully. You can now access your account.
            </p>
            <div className="mt-6">
              <Link href="/dashboard" className="btn btn-primary w-full">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
            <label className="block text-sm font-bold text-slate-900">
              New Password
              <div className="relative mt-2">
                <input
                  name="password"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="field pr-12 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-900 mt-4">
              Confirm New Password
              <input
                name="confirm"
                required
                minLength={8}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="field mt-2 text-slate-900"
              />
            </label>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button
              disabled={loading}
              className="btn btn-primary w-full mt-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating password…
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Update password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
