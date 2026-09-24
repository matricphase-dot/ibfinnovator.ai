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
 * OAuth providers must be enabled in Supabase Dashboard → Authentication → Providers.
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
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    try {
      const { error } = await getSupabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.assign(getNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="w-full max-w-md">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">WELCOME BACK</p>
        <h1 className="text-3xl font-black mt-2">Sign in to IBF</h1>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => oauth("google")}
            disabled={loading !== null}
            className="btn btn-secondary w-full disabled:opacity-50"
          >
            {loading === "google" && <Loader2 size={16} className="animate-spin" />}
            Google
          </button>
          <button
            onClick={() => oauth("linkedin_oidc")}
            disabled={loading !== null}
            className="btn btn-secondary w-full disabled:opacity-50"
          >
            {loading === "linkedin" && <Loader2 size={16} className="animate-spin" />}
            LinkedIn
          </button>
        </div>
        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-white/10" />
          <small className="text-slate-500">or email</small>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <form onSubmit={email} className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-bold">
            Email
            <input name="email" required type="email" autoComplete="email" className="field mt-2" />
          </label>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              required
              minLength={8}
              type="password"
              autoComplete="current-password"
              className="field mt-2"
            />
          </div>
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          <button disabled={loading !== null} className="btn btn-primary w-full mt-6 disabled:opacity-50">
            {loading === "email" && <Loader2 size={16} className="animate-spin" />}
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          No account?{" "}
          <Link href="/auth/signup" className="text-cyan-300 font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
