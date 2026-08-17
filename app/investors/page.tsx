import NavBar from "@/components/NavBar";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Network,
  TrendingUp,
} from "lucide-react";
export default function Page() {
  return (
    <>
      <NavBar />
      <div className="dark-bg text-white">
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <span className="pill glass-dark text-violet-200">
            The collaboration layer for the startup ecosystem
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mt-7">
            Talent discovery is broken.
            <br />
            <span className="text-violet-300">We’re rebuilding it.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-8 mt-7">
            IBF makes high-intent collaboration discoverable, measurable, and
            scalable—from first project to founding team.
          </p>
          <a
            href="mailto:investors@ibfinnovator.ai?subject=IBF%20Investor%20Brief%20Request&body=Hello%20IBF%20team%2C%0A%0AI%20would%20like%20to%20receive%20the%20investor%20brief.%0A%0AName%3A%0AOrganisation%3A%0A"
            className="btn btn-primary mt-9"
          >
            Request investor brief <ArrowRight size={17} />
          </a>
        </section>
      </div>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-center text-xs font-black tracking-widest text-violet-600">
          LIVE PLATFORM SIGNALS
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-9">
          {[
            ["2,847", "Builders"],
            ["436", "Active projects"],
            ["8,920", "Matches created"],
            ["34%", "Monthly growth"],
          ].map((x) => (
            <div className="bg-white border border-slate-200 p-7 rounded-2xl text-center">
              <p className="text-3xl font-black">{x[0]}</p>
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
            <div className="p-7 rounded-2xl bg-violet-50">
              <I className="text-violet-600" />
              <h3 className="font-black mt-5">{t}</h3>
              <p className="text-sm text-slate-600 leading-6 mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
