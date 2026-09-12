"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  UserRound,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

type Role = "STUDENT" | "FOUNDER" | "";

export default function Onboarding() {
  const { user } = useUser();
  const [role, setRole] = useState<Role>("");
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState({
    skills: "",
    interests: "",
    availability: "",
    goals: "",
  });
  const [founder, setFounder] = useState({
    company: "",
    startupTitle: "",
    domain: "",
    stage: "IDEA",
    description: "",
    neededSkills: "",
    commitment: "10",
  });
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");

  const split = (v: string) =>
    v.split(",").map((x) => x.trim()).filter(Boolean);

  const validDetails =
    role === "STUDENT"
      ? student.skills && student.interests && student.availability
      : founder.company &&
        founder.startupTitle &&
        founder.domain &&
        founder.description.length >= 20 &&
        founder.neededSkills;

  async function finish(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1. Save the role + profile details
      const profileBody =
        role === "STUDENT"
          ? {
              role,
              skills: split(student.skills),
              interests: split(student.interests),
              availability: student.availability,
              goals: student.goals,
            }
          : {
              role,
              company: founder.company,
              interests: [founder.domain],
              goals: founder.description,
            };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your profile");

      // 2. Founders get their first project created automatically
      if (role === "FOUNDER") {
        const projectRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: founder.startupTitle,
            description: founder.description,
            required_skills: split(founder.neededSkills),
            domain: founder.domain,
            stage: founder.stage,
            commitment_hours: parseInt(founder.commitment) || 10,
          }),
        });
        if (!projectRes.ok) {
          const err = await projectRes.json().catch(() => ({}));
          throw new Error(err.error || "Could not create your first project");
        }
      }

      toast.success(
        role === "FOUNDER"
          ? "Founder account ready — welcome to IBF"
          : "Builder account ready — welcome to IBF",
      );
      window.location.assign("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <header className="p-6 flex">
        <Link
          href="/"
          className="flex gap-2 items-center font-black text-xl text-white"
        >
          <span className="w-9 h-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center">
            <Sparkles size={18} />
          </span>
          IBF
        </Link>
        <span className="ml-auto text-sm text-slate-500">
          Signed in as{" "}
          <b className="text-slate-300">
            {user?.firstName || user?.username || "new member"}
          </b>{" "}
          ·{" "}
          <Link href="/dashboard" className="text-cyan-300 font-bold">
            Skip for now
          </Link>
        </span>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map((i, index) => (
            <div key={i} className="contents">
              <span
                className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${
                  step >= i
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/10 text-slate-500"
                }`}
              >
                {step > i ? <Check size={14} /> : i}
              </span>
              {index < 1 && (
                <i
                  className={`h-1 flex-1 rounded ${
                    step > i ? "bg-cyan-300/60" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={finish}
          className="bg-[#0d1422] border border-white/[.07] rounded-3xl p-7 md:p-10"
        >
          {step === 1 && (
            <>
              <p className="text-xs font-black text-cyan-300 tracking-widest">
                CHOOSE YOUR PATH
              </p>
              <h1 className="text-3xl font-black mt-2 text-white">
                How will you use IBF?
              </h1>
              <p className="text-slate-500 mt-2">
                We&apos;ll tailor the rest of onboarding to your goal.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-7">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`p-6 rounded-2xl border-2 text-left ${
                    role === "STUDENT"
                      ? "border-cyan-300 bg-cyan-300/[.06]"
                      : "border-white/10"
                  }`}
                >
                  <UserRound className="text-cyan-300" />
                  <b className="block mt-4 text-white">I want to contribute</b>
                  <p className="text-sm text-slate-500 mt-2">
                    Show your skills, interests and availability to founders.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FOUNDER")}
                  className={`p-6 rounded-2xl border-2 text-left ${
                    role === "FOUNDER"
                      ? "border-cyan-300 bg-cyan-300/[.06]"
                      : "border-white/10"
                  }`}
                >
                  <Lightbulb className="text-amber-400" />
                  <b className="block mt-4 text-white">I&apos;m building a startup</b>
                  <p className="text-sm text-slate-500 mt-2">
                    Tell us about your startup and the people you need.
                  </p>
                </button>
              </div>
            </>
          )}
          {step === 2 && role === "STUDENT" && (
            <>
              <p className="text-xs font-black text-cyan-300 tracking-widest">
                YOUR BUILDER PROFILE
              </p>
              <h1 className="text-3xl font-black mt-2 text-white">
                Improve your matches
              </h1>
              <p className="text-slate-500 mt-2">
                Founders will discover you through these details.
              </p>
              <label className="text-sm font-bold block mt-7 text-white">
                Your skills
                <input
                  required
                  value={student.skills}
                  onChange={(e) =>
                    setStudent({ ...student, skills: e.target.value })
                  }
                  className="field mt-2"
                  placeholder="React, finance, product design"
                />
              </label>
              <label className="text-sm font-bold block mt-4 text-white">
                Domains you care about
                <input
                  required
                  value={student.interests}
                  onChange={(e) =>
                    setStudent({ ...student, interests: e.target.value })
                  }
                  className="field mt-2"
                  placeholder="FinTech, Climate Tech, Education"
                />
              </label>
              <label className="text-sm font-bold block mt-4 text-white">
                Weekly availability
                <select
                  required
                  value={student.availability}
                  onChange={(e) =>
                    setStudent({ ...student, availability: e.target.value })
                  }
                  className="field mt-2"
                >
                  <option value="">Choose a range</option>
                  <option>5–10 hrs/week</option>
                  <option>10–20 hrs/week</option>
                  <option>20+ hrs/week</option>
                </select>
              </label>
              <label className="text-sm font-bold block mt-4 text-white">
                What do you want to achieve?
                <textarea
                  value={student.goals}
                  onChange={(e) =>
                    setStudent({ ...student, goals: e.target.value })
                  }
                  className="field mt-2"
                  placeholder="Build real products, find a co-founder…"
                />
              </label>
            </>
          )}
          {step === 2 && role === "FOUNDER" && (
            <>
              <p className="text-xs font-black text-cyan-300 tracking-widest">
                YOUR STARTUP
              </p>
              <h1 className="text-3xl font-black mt-2 text-white">
                Tell us what you&apos;re building
              </h1>
              <p className="text-slate-500 mt-2">
                We&apos;ll create your founder profile and first project.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-7">
                <label className="text-sm font-bold text-white">
                  Startup/company name
                  <input
                    required
                    value={founder.company}
                    onChange={(e) =>
                      setFounder({ ...founder, company: e.target.value })
                    }
                    className="field mt-2"
                    placeholder="Acme Labs"
                  />
                </label>
                <label className="text-sm font-bold text-white">
                  Project title
                  <input
                    required
                    value={founder.startupTitle}
                    onChange={(e) =>
                      setFounder({ ...founder, startupTitle: e.target.value })
                    }
                    className="field mt-2"
                    placeholder="FinFlow"
                  />
                </label>
                <label className="text-sm font-bold text-white">
                  Industry/domain
                  <input
                    required
                    value={founder.domain}
                    onChange={(e) =>
                      setFounder({ ...founder, domain: e.target.value })
                    }
                    className="field mt-2"
                    placeholder="FinTech"
                  />
                </label>
                <label className="text-sm font-bold text-white">
                  Current stage
                  <select
                    value={founder.stage}
                    onChange={(e) =>
                      setFounder({ ...founder, stage: e.target.value })
                    }
                    className="field mt-2"
                  >
                    <option>IDEA</option>
                    <option>MVP</option>
                    <option>BETA</option>
                    <option>REVENUE</option>
                    <option>FUNDED</option>
                  </select>
                </label>
              </div>
              <label className="text-sm font-bold block mt-4 text-white">
                What are you building?
                <textarea
                  required
                  minLength={20}
                  value={founder.description}
                  onChange={(e) =>
                    setFounder({ ...founder, description: e.target.value })
                  }
                  className="field mt-2 min-h-24"
                  placeholder="Describe the problem, your solution and current progress…"
                />
              </label>
              <label className="text-sm font-bold block mt-4 text-white">
                Skills you need
                <input
                  required
                  value={founder.neededSkills}
                  onChange={(e) =>
                    setFounder({ ...founder, neededSkills: e.target.value })
                  }
                  className="field mt-2"
                  placeholder="React, machine learning, growth"
                />
              </label>
              <label className="text-sm font-bold block mt-4 text-white">
                Expected weekly commitment
                <select
                  value={founder.commitment}
                  onChange={(e) =>
                    setFounder({ ...founder, commitment: e.target.value })
                  }
                  className="field mt-2"
                >
                  <option value="5">5 hrs/week</option>
                  <option value="10">10 hrs/week</option>
                  <option value="20">20 hrs/week</option>
                  <option value="30">30+ hrs/week</option>
                </select>
              </label>
            </>
          )}
          {error && (
            <p className="mt-5 p-3 border border-red-400/20 bg-red-400/[.07] text-red-300 rounded-xl text-sm">
              {error}
            </p>
          )}
          <div className="flex mt-9">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              className={`btn btn-secondary ${step === 1 ? "invisible" : ""}`}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {step < 2 ? (
              <button
                type="button"
                disabled={step === 1 && !role}
                onClick={() => setStep(step + 1)}
                className="btn btn-primary ml-auto disabled:opacity-40"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                disabled={loading || !validDetails}
                className="btn btn-primary ml-auto disabled:opacity-40"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                {role === "FOUNDER"
                  ? "Create founder account"
                  : "Create builder account"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
