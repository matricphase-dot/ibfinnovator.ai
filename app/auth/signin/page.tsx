"use client";
import Link from "next/link";
import { Github, Sparkles, Loader2, MailCheck, Info } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
const githubEnabled = process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === "true";
export default function SignIn() {
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [checkEmail, setCheckEmail] = useState(false);
  useEffect(
    () =>
      setCheckEmail(
        new URLSearchParams(location.search).get("checkEmail") === "1",
      ),
    [],
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const s = createClient();
      const { error } = await s.auth.signInWithPassword({
        email: String(f.get("email")).trim(),
        password: String(f.get("password")),
      });
      if (error) throw error;
      location.href = "/dashboard";
    } catch (e: any) {
      setError(
        e.message === "Email not confirmed"
          ? "Confirm your email first. Open the verification message from Supabase, then sign in again."
          : e.message,
      );
    } finally {
      setLoading(false);
    }
  }
  async function oauth(provider: "google" | "github") {
    const enabled = provider === "google" ? googleEnabled : githubEnabled;
    if (!enabled) {
      setError(
        `${provider === "google" ? "Google" : "GitHub"} sign-in is not configured yet. Please use email and password.`,
      );
      return;
    }
    try {
      setError("");
      const s = createClient();
      const { error } = await s.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="p-6 md:p-12 flex flex-col">
        <Link href="/" className="flex gap-2 items-center font-black text-xl">
          <span className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center">
            <Sparkles size={18} />
          </span>
          IBF
        </Link>
        <div className="w-full max-w-md m-auto py-10">
          <p className="text-[10px] uppercase tracking-[.2em] text-cyan-300 font-bold">
            Secure workspace access
          </p>
          <h1 className="text-3xl font-black mt-2">Welcome back</h1>
          <p className="text-slate-500 mt-2">
            Sign in to continue building with your team.
          </p>
          {checkEmail && (
            <div className="mt-6 p-4 border border-cyan-300/20 bg-cyan-300/[.06] rounded-xl flex gap-3">
              <MailCheck className="text-cyan-300 shrink-0" size={20} />
              <div>
                <b className="text-sm text-white">Check your email</b>
                <p className="text-xs text-slate-400 mt-1 leading-5">
                  Your account was created. Click the confirmation link from
                  Supabase before signing in.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mt-7">
            <button
              type="button"
              onClick={() => oauth("google")}
              className={`btn btn-secondary relative ${!googleEnabled ? "opacity-60" : ""}`}
            >
              <b className="text-lg">G</b> Google
              {!googleEnabled && (
                <span className="absolute -top-2 right-2 text-[7px] px-1.5 py-0.5 rounded-full bg-amber-300 text-slate-950">
                  SETUP
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => oauth("github")}
              className={`btn btn-secondary relative ${!githubEnabled ? "opacity-60" : ""}`}
            >
              <Github size={18} />
              GitHub
              {!githubEnabled && (
                <span className="absolute -top-2 right-2 text-[7px] px-1.5 py-0.5 rounded-full bg-amber-300 text-slate-950">
                  SETUP
                </span>
              )}
            </button>
          </div>
          <p className="mt-3 text-[10px] text-slate-500 flex gap-1.5 items-center">
            <Info size={11} />
            Social login requires provider credentials in Supabase.
          </p>
          <div className="flex items-center gap-3 my-6 text-[10px] tracking-[.12em] text-slate-500">
            <i className="h-px bg-white/10 flex-1" />
            OR USE EMAIL
            <i className="h-px bg-white/10 flex-1" />
          </div>
          <form onSubmit={submit}>
            <label className="text-sm font-bold">
              Email address
              <input
                name="email"
                required
                className="field mt-2 mb-4"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="text-sm font-bold">
              Password
              <input
                name="password"
                required
                minLength={8}
                className="field mt-2"
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </label>
            {error && (
              <p className="mt-4 p-3 border border-red-400/20 bg-red-400/[.07] text-red-300 rounded-xl text-sm">
                {error}
              </p>
            )}
            <button disabled={loading} className="btn btn-primary w-full mt-6">
              {loading ? <Loader2 className="animate-spin" size={17} /> : null}
              Sign in
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            New to IBF?{" "}
            <Link href="/auth/signup" className="text-cyan-300 font-bold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex dark-bg p-14 text-white items-end">
        <div className="max-w-lg">
          <span className="text-7xl text-cyan-300">“</span>
          <blockquote className="text-3xl font-bold leading-snug">
            IBF helped me find a team that cared as much about the problem as I
            did.
          </blockquote>
          <p className="mt-6 text-cyan-300/70">Maya · Product designer</p>
        </div>
      </div>
    </div>
  );
}
