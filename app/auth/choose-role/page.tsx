"use client";
import { useState } from "react";
import { Rocket, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
export default function ChooseRole() {
  const [role, setRole] = useState<"FOUNDER" | "STUDENT" | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
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
    <main className="min-h-screen bg-[#0a0f1e] grid place-items-center p-6">
      <div className="max-w-2xl w-full">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          ONE LAST STEP
        </p>
        <h1 className="text-3xl font-black mt-2">How will you use IBF?</h1>
        <p className="text-slate-500 mt-2">
          Choose the workspace that matches your current goal.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-7">
          <button
            onClick={() => setRole("FOUNDER")}
            className={`p-6 rounded-2xl border text-left ${role === "FOUNDER" ? "border-cyan-300 bg-cyan-300/[.07]" : "border-white/10 bg-white/[.02]"}`}
          >
            <Rocket className="text-cyan-300" />
            <b className="block mt-4">Founder</b>
            <p className="text-sm text-slate-500 mt-2">
              Publish startups, recruit talent and manage teams.
            </p>
          </button>
          <button
            onClick={() => setRole("STUDENT")}
            className={`p-6 rounded-2xl border text-left ${role === "STUDENT" ? "border-cyan-300 bg-cyan-300/[.07]" : "border-white/10 bg-white/[.02]"}`}
          >
            <GraduationCap className="text-cyan-300" />
            <b className="block mt-4">Student / Professional</b>
            <p className="text-sm text-slate-500 mt-2">
              Find projects, collaborate and build verified experience.
            </p>
          </button>
        </div>
        {error && <p className="text-red-300 text-sm mt-4">{error}</p>}
        <button
          disabled={!role || loading}
          onClick={save}
          className="btn btn-primary w-full mt-6"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}Continue to
          onboarding
        </button>
      </div>
    </main>
  );
}
