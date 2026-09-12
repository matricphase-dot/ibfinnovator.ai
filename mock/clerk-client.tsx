"use client";
// DEV-ONLY demo shim for `@clerk/nextjs`.
// Active only when DEMO_MODE=true (see next.config.ts). This sandbox cannot
// reach clerk.com, so these components STAND IN for Clerk's hosted widgets so
// the full app flow can be demoed. With real Clerk keys, the real components
// render instead — this file never runs.
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

type DemoSession = { id: string; name: string; email: string };

function readSession(): DemoSession | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)demo_session=([^;]*)/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function setSession(s: DemoSession) {
  document.cookie =
    "demo_session=" +
    encodeURIComponent(JSON.stringify(s)) +
    "; path=/; max-age=" +
    60 * 60 * 24 +
    "; SameSite=Lax";
}

function DemoRibbon() {
  return (
    <div className="flex items-start gap-2 text-left text-[11px] leading-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
      <span>
        <b>DEMO MODE</b> — this form is a local stub of Clerk&apos;s hosted
        sign-in widget. With your real Clerk keys (running{" "}
        <code>npm run dev</code> on your machine), the genuine Clerk component
        renders here and handles passwords, Google/GitHub and email
        verification for you.
      </span>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const s = readSession();
  return { isLoaded: true, isSignedIn: !!s, userId: s?.id ?? null };
}

export function useUser() {
  const s = readSession();
  return {
    isLoaded: true,
    isSignedIn: !!s,
    user: s
      ? {
          id: s.id,
          firstName: s.name.split(" ")[0] || s.name,
          fullName: s.name,
          username: null,
          imageUrl: null,
          primaryEmailAddress: { emailAddress: s.email },
        }
      : null,
  };
}

export function useClerk() {
  return {
    openUserProfile: () =>
      alert(
        "DEMO MODE — in production this opens Clerk's account management modal (password, 2FA, connected accounts).",
      ),
    signOut: async (callback?: () => void) => {
      document.cookie = "demo_session=; path=/; max-age=0";
      callback?.();
    },
  };
}

export function SignIn({
  signUpUrl = "/auth/signup",
  fallbackRedirectUrl = "/dashboard",
}: {
  signUpUrl?: string;
  fallbackRedirectUrl?: string;
  appearance?: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function start(s: DemoSession, to: string) {
    setSession(s);
    window.location.assign(to || fallbackRedirectUrl);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    if (!email || !password) return setError("Email and password are required.");
    setLoading(true);
    // Any credentials sign the demo user in (no real password check offline).
    start(
      {
        id: "user_2demo" + Math.random().toString(36).slice(2, 14),
        name: email.split("@")[0],
        email,
      },
      fallbackRedirectUrl,
    );
  }

  return (
    <div className="text-slate-900">
      <DemoRibbon />
      <h2 className="text-xl font-bold text-center">Sign in to IBF</h2>
      <p className="text-xs text-slate-500 text-center mt-1">
        Welcome back! Please sign in to continue.
      </p>
      <button
        type="button"
        onClick={() =>
          start(
            {
              id: "user_2demoStudentIBF000000000001",
              name: "Demo Student",
              email: "demo.student@ibf.dev",
            },
            fallbackRedirectUrl,
          )
        }
        className="mt-4 w-full rounded-lg bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800"
      >
        Continue as seeded demo student →
      </button>
      <div className="flex items-center gap-3 my-4 text-[10px] tracking-wider text-slate-400">
        <i className="h-px bg-slate-200 flex-1" />
        OR USE EMAIL
        <i className="h-px bg-slate-200 flex-1" />
      </div>
      <form onSubmit={submit}>
        <label className="block text-xs font-semibold text-slate-600">
          Email address
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass + " mt-1"}
            autoComplete="email"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 mt-3">
          Password
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className={inputClass + " mt-1"}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Sign in"}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-4">
        Don&apos;t have an account?{" "}
        <a href={signUpUrl} className="font-semibold text-slate-900 underline">
          Sign up
        </a>
      </p>
    </div>
  );
}

export function SignUp({
  signInUrl = "/auth/signin",
  fallbackRedirectUrl = "/onboarding",
}: {
  signInUrl?: string;
  fallbackRedirectUrl?: string;
  appearance?: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    if (!name || !email) return setError("Name and email are required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    setSession({
      id: "user_2demo" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name,
      email,
    });
    window.location.assign(fallbackRedirectUrl);
  }

  return (
    <div className="text-slate-900">
      <DemoRibbon />
      <h2 className="text-xl font-bold text-center">Create your account</h2>
      <p className="text-xs text-slate-500 text-center mt-1">
        Sign up to start building with IBF.
      </p>
      <form onSubmit={submit} className="mt-4">
        <label className="block text-xs font-semibold text-slate-600">
          Full name
          <input
            name="name"
            required
            placeholder="Alex Rivera"
            className={inputClass + " mt-1"}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 mt-3">
          Email address
          <input
            name="email"
            type="email"
            required
            placeholder="alex@example.com"
            className={inputClass + " mt-1"}
            autoComplete="email"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 mt-3">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={inputClass + " mt-1"}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Continue"}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-4">
        Already have an account?{" "}
        <a href={signInUrl} className="font-semibold text-slate-900 underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
