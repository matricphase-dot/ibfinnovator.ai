"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, UserRound, Lightbulb, Loader2, ArrowRight } from "lucide-react";

type Role = "FOUNDER" | "STUDENT";

export default function ChooseRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!role || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save your role");

      router.push("/auth/complete-onboarding");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <header className="p-6 flex">
        <Link href="/" className="flex gap-2 items-center font-black text-xl text-white">
          <span className="w-9 h-9 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center">
            <Sparkles size={18} />
          </span>
          IBF
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10"
        >
          <p className="text-xs font-black text-cyan-600 tracking-widest">
            CHOOSE YOUR PATH
          </p>
          <h1 className="text-3xl font-black mt-2">How will you use IBF?</h1>
          <p className="text-slate-500 mt-2">
            We&rsquo;ll tailor the rest of onboarding to your goal.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-7">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`p-6 rounded-2xl border-2 text-left ${role === "STUDENT" ? "border-cyan-500 bg-cyan-50" : "border-slate-200"}`}
            >
              <UserRound className="text-cyan-600" />
              <b className="block mt-4">I want to contribute</b>
              <p className="text-sm text-slate-500 mt-2">
                Show your skills, interests and availability to founders.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("FOUNDER")}
              className={`p-6 rounded-2xl border-2 text-left ${role === "FOUNDER" ? "border-cyan-500 bg-cyan-50" : "border-slate-200"}`}
            >
              <Lightbulb className="text-amber-500" />
              <b className="block mt-4">I&rsquo;m building a startup</b>
              <p className="text-sm text-slate-500 mt-2">
                Tell us about your startup and the people you need.
              </p>
            </button>
          </div>
          {error && (
            <p className="mt-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </p>
          )}
          <div className="flex mt-9">
            <button
              disabled={loading || !role}
              className="btn btn-primary ml-auto disabled:opacity-40"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
