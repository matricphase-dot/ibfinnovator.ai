"use client";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * ROOT (Supabase-only): email signup (verification link) + Google + LinkedIn (OIDC).
 * Profile row is auto-created by handle_new_user(); role chosen next.
 */
export default function SignUpPage() {
  const [loading, setLoading] = useState<"email" | "google" | "linkedin" | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function oauth(provider: "google" | "linkedin_oidc") {
    setLoading(provider === "google" ? "google" : "linkedin");
    setError("");
    try {
      const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/choose-role")}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "OAuth sign-up failed");
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
    const name = String(f.get("name") || "").trim();
    try {
      const { data, error } = await getSupabaseBrowser().auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/choose-role")}`,
        },
      });
      if (error) throw error;
      if (data?.session) {
        window.location.assign("/auth/choose-role");
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="w-full max-w-md">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">ACCOUNT · STEP 1 OF 5</p>
        <h1 className="text-3xl font-black mt-2">Create your IBF account</h1>
        <p className="text-sm text-slate-500 mt-2">
          Supabase Auth handles email verification plus Google and LinkedIn login.
          Your role-specific profile follows next.
        </p>
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
        {sent ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm">
            Check your inbox for the verification link, then continue to role selection.
          </div>
        ) : (
          <form onSubmit={email} className="bg-white border border-slate-200 rounded-2xl p-6">
            <label className="block text-sm font-bold">
              Full name
              <input name="name" required minLength={2} autoComplete="name" className="field mt-2" />
            </label>
            <label className="block text-sm font-bold mt-4">
              Email
              <input name="email" required type="email" autoComplete="email" className="field mt-2" />
            </label>
            <label className="block text-sm font-bold mt-4">
              Password
              <input name="password" required minLength={8} type="password" autoComplete="new-password" className="field mt-2" />
            </label>
            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            <button disabled={loading !== null} className="btn btn-primary w-full mt-6 disabled:opacity-50">
              {loading === "email" && <Loader2 size={16} className="animate-spin" />}
              Create account
            </button>
          </form>
        )}
        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-cyan-300 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
