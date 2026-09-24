"use client";

import Link from "next/link";
import { useState } from "react";
import { Rocket, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChooseRolePage() {
  const [role, setRole] = useState<"FOUNDER" | "STUDENT" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function save() {
    if (!role) return;
    setLoading(true);
    setError("");
    const r = await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (r.status === 401) return router.replace("/auth/signin");
    if (!r.ok) return setError(d.error || "Unable to save role");
    router.replace("/auth/complete-onboarding");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--base)] text-[var(--ink)] flex flex-col justify-between p-6 sm:p-8">
      {/* Top masthead */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight hover:opacity-85 transition"
        >
          IBF
        </Link>
        <span className="font-mono-eyebrow text-[10px]">INNOVATOR BRIDGE FOUNDRY</span>
      </header>

      {/* Main selection area */}
      <div className="w-full max-w-2xl mx-auto my-8">
        <div className="text-center sm:text-left mb-8">
          <p className="font-mono-eyebrow text-[10px] text-[var(--muted)]">STEP 2 OF 5 · WORKSPACE INTENT</p>
          <h1 className="editorial-title text-3xl sm:text-4xl mt-2 text-[var(--ink)]">
            How will you use IBF?
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-xl">
            Choose your primary role to configure your workspace, matching preferences, and onboarding sequence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("FOUNDER")}
            className={`p-6 border text-left rounded-[2px] transition ${
              role === "FOUNDER"
                ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)] shadow-xs"
                : "border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--muted)]"
            }`}
          >
            <div className="w-10 h-10 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent)]">
              <Rocket size={20} />
            </div>
            <h2 className="font-display text-xl font-medium text-[var(--ink)] mt-5">Founder</h2>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
              Post startup briefs, recruit vetted engineers and researchers, and manage verified milestones.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole("STUDENT")}
            className={`p-6 border text-left rounded-[2px] transition ${
              role === "STUDENT"
                ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)] shadow-xs"
                : "border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--muted)]"
            }`}
          >
            <div className="w-10 h-10 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--deep)]">
              <GraduationCap size={20} />
            </div>
            <h2 className="font-display text-xl font-medium text-[var(--ink)] mt-5">Student / Builder</h2>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
              Join open venture projects, collaborate directly with founders, and build on-chain proof of work.
            </p>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 bg-[#FDF1EE] border border-[#F2C5BC] rounded-[2px] text-xs text-[#9C3826] leading-relaxed"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={!role || loading}
          onClick={save}
          className="btn-editorial w-full mt-6 text-sm font-medium disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Saving role…
            </span>
          ) : (
            "Continue to onboarding"
          )}
        </button>
      </div>

      {/* Footer colophon */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[var(--muted)] pt-4">
        © 2026 Innovator Bridge Foundry · Step 2 of 5
      </footer>
    </main>
  );
}
