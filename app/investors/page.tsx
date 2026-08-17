"use client";
import NavBar from "@/components/NavBar";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Globe2,
  Loader2,
  Network,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
const requestOptions = [
  ["PITCH_DECK", "Pitch deck"],
  ["DATA_ROOM", "Data room access"],
  ["PRODUCT_DEMO", "Product demo"],
  ["FOUNDER_MEETING", "Founder meeting"],
  ["PARTNERSHIP", "Strategic partnership"],
  ["FINANCIAL_MODEL", "Financial model"],
];
const stages = ["Pre-seed", "Seed", "Series A", "Growth"];
const sectors = [
  "Future of Work",
  "AI & Data",
  "EdTech",
  "SaaS",
  "Talent Infrastructure",
  "University Partnerships",
];
export default function Page() {
  const [open, setOpen] = useState(false),
    [requests, setRequests] = useState<string[]>([]),
    [stage, setStage] = useState<string[]>([]),
    [sector, setSector] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  function toggle(v: string, list: string[], set: (v: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!requests.length)
      return setError("Select at least one item you would like to request.");
    setLoading(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/investor-inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          organization: f.get("organization"),
          role_title: f.get("role_title"),
          investor_type: f.get("investor_type"),
          check_size: f.get("check_size"),
          geography: f.get("geography"),
          investment_thesis: f.get("investment_thesis"),
          specific_ask: f.get("specific_ask"),
          website: f.get("website"),
          request_types: requests,
          stage_interest: stage,
          sector_interest: sector,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <NavBar />
      <div className="dark-bg text-white">
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <span className="pill glass-dark text-violet-200">
            The collaboration layer for the startup ecosystem
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mt-7 leading-[1.02]">
            Talent discovery is broken.
            <br />
            <span className="text-violet-300">We’re rebuilding it.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-8 mt-7">
            IBF makes high-intent collaboration discoverable, measurable, and
            scalable—from first project to founding team.
          </p>
          <button
            onClick={() => {
              setOpen(true);
              setSuccess(false);
            }}
            className="btn btn-primary mt-9"
          >
            Request investor brief <ArrowRight size={17} />
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Tell us what you need so we can send the right materials—not a
            generic deck.
          </p>
        </section>
      </div>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-center text-xs font-black tracking-widest text-violet-600">
          PLATFORM OPPORTUNITY
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-9">
          {[
            ["Dual-sided", "Founder + talent network"],
            ["Structured", "Project collaboration"],
            ["Verifiable", "Reputation signals"],
            ["Scalable", "University distribution"],
          ].map((x) => (
            <div
              className="bg-white border border-slate-200 p-7 rounded-2xl text-center"
              key={x[0]}
            >
              <p className="text-2xl font-black">{x[0]}</p>
              <p className="text-sm text-slate-500 mt-2">{x[1]}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-16">
          {[
            [
              Network,
              "Network effects",
              "Every successful collaboration strengthens identity, trust, and future match quality.",
            ],
            [
              BarChart3,
              "Data advantage",
              "First-party collaboration signals go far beyond resumes and profile keywords.",
            ],
            [
              Globe2,
              "Multi-sided growth",
              "Founders, talent, universities and ecosystem partners compound distribution.",
            ],
          ].map(([I, t, d]: any) => (
            <div
              className="p-7 rounded-2xl bg-violet-50 border border-cyan-300/10"
              key={t}
            >
              <I className="text-violet-600" />
              <h3 className="font-black mt-5">{t}</h3>
              <p className="text-sm text-slate-600 leading-6 mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto bg-[#111827] border border-white/10 rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center p-5 md:px-7 border-b border-white/[.07] bg-[#111827]/95 backdrop-blur-xl rounded-t-2xl">
              <div>
                <p className="text-[9px] tracking-[.18em] text-cyan-300 font-bold">
                  INVESTOR RELATIONS
                </p>
                <h2 className="text-xl font-black mt-1">
                  Request tailored materials
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto h-9 w-9 rounded-lg border border-white/10 grid place-items-center text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {success ? (
              <div className="p-10 md:p-16 text-center">
                <span className="h-16 w-16 mx-auto rounded-full bg-cyan-300 text-slate-950 grid place-items-center">
                  <Check size={28} />
                </span>
                <h2 className="text-3xl font-black mt-6">Request received.</h2>
                <p className="text-slate-400 mt-3 max-w-md mx-auto leading-7">
                  Thank you. The IBF team now has the context needed to prepare
                  the right materials and follow up with you.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn btn-primary mt-7"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 md:p-7">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="text-sm font-bold">
                    Full name *
                    <input
                      required
                      name="name"
                      className="field mt-2"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Work email *
                    <input
                      required
                      name="email"
                      type="email"
                      className="field mt-2"
                      placeholder="you@fund.com"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Organisation *
                    <input
                      required
                      name="organization"
                      className="field mt-2"
                      placeholder="Fund or organisation"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Role / title
                    <input
                      name="role_title"
                      className="field mt-2"
                      placeholder="Partner, Principal, Director"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Investor type *
                    <select
                      required
                      name="investor_type"
                      className="field mt-2"
                    >
                      <option value="">Select type</option>
                      <option value="ANGEL">Angel investor</option>
                      <option value="VC">Venture capital</option>
                      <option value="FAMILY_OFFICE">Family office</option>
                      <option value="CORPORATE">Corporate venture</option>
                      <option value="ACCELERATOR">Accelerator</option>
                      <option value="UNIVERSITY">University / ecosystem</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold">
                    Typical cheque size
                    <select name="check_size" className="field mt-2">
                      <option value="">Prefer not to say</option>
                      <option>Under $100K</option>
                      <option>$100K–$500K</option>
                      <option>$500K–$2M</option>
                      <option>$2M–$10M</option>
                      <option>$10M+</option>
                    </select>
                  </label>
                </div>
                <fieldset className="mt-6">
                  <legend className="text-sm font-bold">
                    What would you like from us? *
                  </legend>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {requestOptions.map(([v, l]) => (
                      <button
                        type="button"
                        onClick={() => toggle(v, requests, setRequests)}
                        className={`p-3 rounded-xl border text-xs text-left flex gap-2 ${requests.includes(v) ? "border-cyan-300/40 bg-cyan-300/[.08] text-cyan-300" : "border-white/10 text-slate-400"}`}
                        key={v}
                      >
                        <i
                          className={`h-4 w-4 rounded border grid place-items-center ${requests.includes(v) ? "bg-cyan-300 border-cyan-300 text-slate-950" : ""}`}
                        >
                          {requests.includes(v) && <Check size={11} />}
                        </i>
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-6">
                  <legend className="text-sm font-bold">Stage interest</legend>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {stages.map((v) => (
                      <button
                        type="button"
                        onClick={() => toggle(v, stage, setStage)}
                        className={`pill border ${stage.includes(v) ? "border-cyan-300/40 bg-cyan-300/[.08] text-cyan-300" : "border-white/10 text-slate-400"}`}
                        key={v}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-6">
                  <legend className="text-sm font-bold">Sector interest</legend>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sectors.map((v) => (
                      <button
                        type="button"
                        onClick={() => toggle(v, sector, setSector)}
                        className={`pill border ${sector.includes(v) ? "border-cyan-300/40 bg-cyan-300/[.08] text-cyan-300" : "border-white/10 text-slate-400"}`}
                        key={v}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <label className="text-sm font-bold">
                    Geographic focus
                    <input
                      name="geography"
                      className="field mt-2"
                      placeholder="India, APAC, Global"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Investment thesis
                    <textarea
                      name="investment_thesis"
                      className="field mt-2 min-h-24"
                      placeholder="What kinds of companies and outcomes matter to you?"
                    />
                  </label>
                </div>
                <label className="block text-sm font-bold mt-5">
                  What specifically are you asking for? *
                  <textarea
                    required
                    minLength={20}
                    maxLength={3000}
                    name="specific_ask"
                    className="field mt-2 min-h-32"
                    placeholder="Tell us what you want to evaluate, questions you need answered, desired meeting participants, timeline, partnership interest, or diligence requirements."
                  />
                </label>
                <input
                  name="website"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />
                {error && (
                  <p className="mt-4 p-3 rounded-xl border border-red-400/20 bg-red-400/[.06] text-red-300 text-sm">
                    {error}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[.07]">
                  <ShieldCheck className="text-cyan-300 shrink-0" size={18} />
                  <p className="text-[10px] text-slate-500">
                    Your details are used only to respond to this investor or
                    partnership request.
                  </p>
                  <button
                    disabled={loading}
                    className="btn btn-primary ml-auto shrink-0"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Submit request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
