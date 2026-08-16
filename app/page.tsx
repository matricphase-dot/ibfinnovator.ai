import Link from "next/link";
import NavBar from "@/components/NavBar";
import MotionController from "@/components/MotionController";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Globe2,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users2,
  Zap,
} from "lucide-react";
const domains = [
  "Fintech",
  "E-commerce",
  "HealthTech",
  "Logistics",
  "Sustainability",
  "EdTech",
];
const steps = [
  {
    n: "01",
    icon: Users2,
    title: "Create Your Profile",
    text: "A role-aware onboarding flow captures your skills, startup context, goals and availability without unnecessary friction.",
  },
  {
    n: "02",
    icon: BrainCircuit,
    title: "AI Matches You",
    text: "Our matching engine scores skill fit, domain alignment, availability and preferred engagement style.",
  },
  {
    n: "03",
    icon: Zap,
    title: "Start Building",
    text: "Connect, enter a shared workspace and turn the right introduction into visible weekly progress.",
  },
];
const testimonials = [
  [
    "“IBF found the exact product and ML talent our climate startup needed. We went from stalled idea to working pilot in weeks.”",
    "Aisha K.",
    "Founder · GreenScale",
    "AK",
  ],
  [
    "“Instead of another course project, I shipped a real recommendation engine and earned endorsements I can actually show.”",
    "Rahul M.",
    "Engineering student",
    "RM",
  ],
  [
    "“The quality of context is different. Every introduction already understands the problem, scope and expected commitment.”",
    "Sara L.",
    "Founder · FinFlow",
    "SL",
  ],
  [
    "“I joined for experience and found a team where I could own meaningful design work from the first week.”",
    "Dev P.",
    "Product designer",
    "DP",
  ],
];
export default function Home() {
  return (
    <div className="landing-shell overflow-hidden">
      <NavBar />
      <MotionController />
      <main>
        <section className="hero-cyber relative min-h-[820px] flex items-center border-b border-white/5">
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-lines" />
          <div className="absolute inset-x-0 top-28 hidden lg:block pointer-events-none">
            {domains.map((d, i) => (
              <span key={d} className={`domain-float domain-${i}`}>
                {d}
              </span>
            ))}
          </div>
          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.06] px-4 py-2 text-[11px] font-bold tracking-[.16em] text-cyan-300 uppercase">
              <span className="relative flex h-2 w-2">
                <i className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <i className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              Next-gen startup × talent matching
            </div>
            <h1 className="hero-title mt-8 font-black leading-[.9] tracking-[-.065em]">
              Where
              <br className="sm:hidden" />
              <span className="text-white">Visionaries</span>
              <br />
              <span className="hero-gradient">Meet Prodigies</span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-base md:text-lg leading-8 text-slate-400">
              An intelligent collaboration network connecting ambitious founders
              with high-potential students and professionals—matched on skills,
              context, pace and purpose.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="cyber-btn cyber-btn-primary group"
              >
                I’m a Founder{" "}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
              <Link href="/auth/signup" className="cyber-btn cyber-btn-ghost">
                I’m a Student <ChevronRight size={17} />
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-cyan-300" />
                Free to get started
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-300" />
                Verified collaboration history
              </span>
              <span className="flex items-center gap-2">
                <Globe2 size={15} className="text-cyan-300" />
                Remote-first network
              </span>
            </div>
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="dashboard-glow" />
              <div className="hero-console relative">
                <div className="flex items-center gap-2 border-b border-white/[.07] px-5 py-3">
                  <i className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <i className="h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
                  <span className="ml-3 font-mono text-[10px] text-slate-500">
                    IBF / MATCH ENGINE / LIVE
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-300">
                    <i className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
                    SYSTEM ONLINE
                  </span>
                </div>
                <div className="grid md:grid-cols-[1fr_180px] gap-4 p-4 md:p-6 text-left">
                  <div className="console-card">
                    <div className="flex items-start gap-3">
                      <span className="h-11 w-11 rounded-xl grid place-items-center bg-cyan-300 text-slate-950 font-black">
                        EC
                      </span>
                      <div>
                        <p className="font-bold text-white">EcoTrack AI</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Climate Intelligence · MVP
                        </p>
                      </div>
                      <span className="ml-auto match-chip">
                        <Sparkles size={11} />
                        94% MATCH
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-slate-400">
                      Building practical AI that turns business activity into
                      measurable, actionable climate progress.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Python", "Machine Learning", "React"].map((x) => (
                        <span key={x} className="tech-chip">
                          {x}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="match-progress h-full w-[94%] rounded-full" />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="metric-mini">
                      <span>Match quality</span>
                      <b>94%</b>
                    </div>
                    <div className="metric-mini">
                      <span>Availability</span>
                      <b>Aligned</b>
                    </div>
                    <div className="metric-mini">
                      <span>Skills overlap</span>
                      <b>3 / 3</b>
                    </div>
                  </div>
                </div>
              </div>
              <div className="avatar-stack absolute -bottom-5 left-1/2 -translate-x-1/2">
                <div className="flex -space-x-2">
                  {["AK", "RM", "SL", "DP"].map((x, i) => (
                    <span
                      key={x}
                      className="avatar-node"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      {x}
                    </span>
                  ))}
                </div>
                <span className="ml-3 text-xs text-slate-400">
                  <b className="text-white">500+</b> active builders
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-b border-white/[.06] bg-[#0d1322]">
          <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[.06]">
            {[
              ["98%", "Match rate"],
              ["24h", "Avg. match time"],
              ["1.8K+", "Milestones shipped"],
              ["430+", "Projects launched"],
            ].map(([v, l]) => (
              <div className="px-6 py-10 text-center">
                <p className="font-display text-3xl md:text-4xl font-black text-white">
                  {v}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[.16em] text-slate-500">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section id="how" className="section-dark relative py-28">
          <div className="section-grid" />
          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="section-kicker">Simple process</div>
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div>
                <h2 className="section-title">
                  From profile to
                  <br />
                  <span className="text-cyan-300">
                    progress in three steps.
                  </span>
                </h2>
              </div>
              <p className="md:ml-auto max-w-md text-slate-400 leading-7">
                No noisy job boards, cold outreach or contextless applications.
                IBF is designed around high-intent collaboration.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mt-16">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <article className="process-card group" key={s.n}>
                    <div className="flex items-center justify-between">
                      <span className="step-number">{s.n}</span>
                      <span className="icon-cube">
                        <Icon size={21} />
                      </span>
                    </div>
                    <div className="process-line">
                      <i />
                    </div>
                    <h3 className="text-xl font-bold text-white">{s.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {s.text}
                    </p>
                    <div className="mt-7 flex items-center gap-2 text-xs font-bold text-cyan-300 opacity-0 transition group-hover:opacity-100">
                      Learn more <ArrowRight size={13} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section className="py-28 bg-[#0d1322] border-y border-white/[.05]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="section-kicker justify-center">Core features</div>
              <h2 className="section-title">
                Built for <span className="text-cyan-300">scale & speed.</span>
              </h2>
              <p className="mt-5 text-slate-400 leading-7">
                Everything needed to discover, evaluate and collaborate with the
                right people—inside one focused operating system.
              </p>
            </div>
            <div className="bento-grid mt-16">
              <article className="bento-card bento-large">
                <div className="feature-icon">
                  <BrainCircuit />
                </div>
                <span className="feature-label">Matching intelligence</span>
                <h3>Context, not just keywords.</h3>
                <p>
                  Multidimensional scoring understands requirements, experience,
                  domain interest, availability and collaboration preferences.
                </p>
                <div className="radar-visual">
                  <div className="radar-ring r1" />
                  <div className="radar-ring r2" />
                  <div className="radar-ring r3" />
                  <div className="radar-sweep" />
                  <span className="radar-dot d1" />
                  <span className="radar-dot d2" />
                  <span className="radar-dot d3" />
                  <b>94%</b>
                </div>
              </article>
              <article className="bento-card">
                <div className="feature-icon amber">
                  <MessageSquareText />
                </div>
                <span className="feature-label">IBF Advisor</span>
                <h3>Guidance with context.</h3>
                <div className="advisor-bubble">
                  “Your seed-stage project needs a React builder with strong
                  product instincts and 10+ weekly hours.”
                </div>
              </article>
              <article className="bento-card">
                <div className="feature-icon">
                  <Layers3 />
                </div>
                <span className="feature-label">Team workspace</span>
                <h3>Move from match to momentum.</h3>
                <div className="milestone-list">
                  <span>
                    <i className="done" />
                    Onboarding <b>Done</b>
                  </span>
                  <span>
                    <i className="active" />
                    Core build <b>In progress</b>
                  </span>
                  <span>
                    <i />
                    Pilot launch <b>Upcoming</b>
                  </span>
                </div>
              </article>
              <article className="bento-card bento-wide">
                <div>
                  <div className="feature-icon amber">
                    <BarChart3 />
                  </div>
                  <span className="feature-label">Verifiable growth</span>
                  <h3>Work that compounds your reputation.</h3>
                  <p>
                    Milestones, reviews and skill endorsements turn every
                    successful project into trusted proof for the next
                    opportunity.
                  </p>
                </div>
                <div className="reputation-card">
                  <div className="flex items-center">
                    <span className="h-10 w-10 rounded-full bg-cyan-300 text-slate-950 grid place-items-center font-bold">
                      AR
                    </span>
                    <div className="ml-3">
                      <b>Alex Rivera</b>
                      <p>ML Engineer</p>
                    </div>
                    <span className="ml-auto text-amber-300 flex">
                      <Star size={13} fill="currentColor" /> 4.9
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <span>
                      <b>8</b>Projects
                    </span>
                    <span>
                      <b>24</b>Endorsements
                    </span>
                    <span>
                      <b>96%</b>Reliability
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="py-28 section-dark border-b border-white/[.05]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="section-kicker">One network, two ambitions</div>
            <h2 className="section-title max-w-3xl">
              Designed for both sides of the{" "}
              <span className="text-cyan-300">building equation.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-slate-400 leading-7">
              IBF is not a traditional recruitment marketplace. It creates
              structured, high-context collaborations where founders get
              meaningful execution and emerging talent gets meaningful
              ownership.
            </p>
            <div className="audience-grid mt-14">
              <article className="audience-card founder-card">
                <div className="audience-top">
                  <span className="feature-icon">
                    <Target />
                  </span>
                  <span>FOR FOUNDERS</span>
                </div>
                <h3>Turn an ambitious idea into an operating team.</h3>
                <p>
                  Publish what you are building, explain the stage and define
                  exactly where you need momentum. IBF ranks compatible students
                  and professionals by more than a résumé keyword.
                </p>
                <ul>
                  {[
                    "Discover talent aligned to your domain and pace",
                    "Review portfolios, availability and collaboration goals",
                    "Create milestones, schedule meetings and manage delivery",
                    "Build a trusted long-term team without recruitment noise",
                  ].map((x) => (
                    <li key={x}>
                      <CheckCircle2 size={15} />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="audience-link">
                  Build your team <ArrowRight size={15} />
                </Link>
              </article>
              <article className="audience-card talent-card">
                <div className="audience-top">
                  <span className="feature-icon amber">
                    <Code2 />
                  </span>
                  <span>FOR STUDENTS & PROFESSIONALS</span>
                </div>
                <h3>Build proof through work that actually matters.</h3>
                <p>
                  Move beyond simulated assignments. Join startups where your
                  contribution has visible product impact and every completed
                  milestone strengthens your professional identity.
                </p>
                <ul>
                  {[
                    "Find projects matched to your real skills and interests",
                    "Work directly with founders in structured team rooms",
                    "Earn reviews, skill endorsements and portfolio proof",
                    "Explore co-founder opportunities with values alignment",
                  ].map((x) => (
                    <li key={x}>
                      <CheckCircle2 size={15} />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="audience-link">
                  Find your project <ArrowRight size={15} />
                </Link>
              </article>
            </div>
          </div>
        </section>
        <section className="py-28 bg-[#0d1322] border-b border-white/[.05]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="section-kicker justify-center">
                The collaboration lifecycle
              </div>
              <h2 className="section-title">
                Everything after the{" "}
                <span className="text-cyan-300">match.</span>
              </h2>
              <p className="mt-5 text-slate-400 leading-7">
                A strong introduction is only the beginning. IBF gives every
                team a clear path from first conversation to completed outcomes.
              </p>
            </div>
            <div className="lifecycle mt-16">
              {[
                [
                  "01",
                  "Connect",
                  "Send or accept a context-rich collaboration request.",
                  Users2,
                ],
                [
                  "02",
                  "Align",
                  "Discuss scope, commitment, ownership and working style.",
                  MessageSquareText,
                ],
                [
                  "03",
                  "Plan",
                  "Turn the project into assigned milestones and due dates.",
                  Layers3,
                ],
                [
                  "04",
                  "Build",
                  "Collaborate in focused channels with files and updates.",
                  Code2,
                ],
                [
                  "05",
                  "Verify",
                  "Close the loop with reviews, endorsements and proof.",
                  ShieldCheck,
                ],
              ].map(([n, title, text, Icon]: any) => (
                <article className="lifecycle-step" key={n}>
                  <span className="lifecycle-number">{n}</span>
                  <span className="lifecycle-icon">
                    <Icon size={18} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="trust-strip mt-14">
              <div>
                <LockKeyhole />
                <span>
                  <b>Privacy by design</b>Role-aware access and protected
                  collaboration rooms.
                </span>
              </div>
              <div>
                <Clock3 />
                <span>
                  <b>Built for momentum</b>Clear availability, milestones and
                  response signals.
                </span>
              </div>
              <div>
                <ShieldCheck />
                <span>
                  <b>Reputation that travels</b>Reviews and endorsements tied to
                  completed work.
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="py-28 section-dark">
          <div className="max-w-6xl mx-auto px-6">
            <div className="section-kicker">What you can build here</div>
            <h2 className="section-title max-w-3xl">
              From first prototype to{" "}
              <span className="text-cyan-300">founding team.</span>
            </h2>
            <div className="usecase-grid mt-14">
              {[
                [
                  "MVP & product builds",
                  "Find engineering, design and product collaborators to move from idea to testable release.",
                  "01",
                ],
                [
                  "AI and data projects",
                  "Match with ML, analytics and data talent for models, automation and decision tools.",
                  "02",
                ],
                [
                  "Growth experiments",
                  "Bring in research, content, sales and marketing talent to validate distribution channels.",
                  "03",
                ],
                [
                  "Co-founder discovery",
                  "Compare vision, values, commitment and complementary skills before making a major decision.",
                  "04",
                ],
                [
                  "University collaboration",
                  "Connect students to startup work that produces experience, evidence and employability.",
                  "05",
                ],
                [
                  "Mission-driven innovation",
                  "Form multidisciplinary teams around climate, education, health and social-impact problems.",
                  "06",
                ],
              ].map((x) => (
                <article className="usecase-card" key={x[2]}>
                  <span>{x[2]}</span>
                  <h3>{x[0]}</h3>
                  <p>{x[1]}</p>
                  <i />
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="py-28 section-dark overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="section-kicker">Social proof</div>
            <h2 className="section-title">
              Built by ambition.
              <br />
              <span className="text-cyan-300">Trusted through outcomes.</span>
            </h2>
          </div>
          <div className="testimonial-marquee mt-14">
            <div className="testimonial-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <article className="testimonial-card" key={i}>
                  <div className="flex text-amber-300 gap-1">
                    {[1, 2, 3, 4, 5].map((x) => (
                      <Star key={x} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <blockquote>{t[0]}</blockquote>
                  <div className="flex items-center mt-6">
                    <span>{t[3]}</span>
                    <div className="ml-3">
                      <b>{t[1]}</b>
                      <p>{t[2]}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="py-28 bg-[#0d1322] border-y border-white/[.05]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center">
              <div className="section-kicker justify-center">
                Frequently asked questions
              </div>
              <h2 className="section-title">
                Understand IBF before you{" "}
                <span className="text-cyan-300">jump in.</span>
              </h2>
            </div>
            <div className="faq-grid mt-14">
              {[
                [
                  "Is IBF a job board?",
                  "No. IBF is a collaboration platform built around projects, team formation and verifiable outcomes. A project can evolve into an internship, long-term role or co-founder relationship, but the starting point is meaningful work.",
                ],
                [
                  "How does matchmaking work?",
                  "Each project and profile is scored using required-skill overlap, domain interest, weekly availability and engagement preference. The result includes a transparent compatibility score and clear reasons.",
                ],
                [
                  "Can founders offer equity or stipends?",
                  "Yes. Founders can describe equity, stipend or volunteer arrangements, expected commitment and duration so candidates understand the opportunity before connecting.",
                ],
                [
                  "What makes student experience verifiable?",
                  "Completed milestones, project reviews and skill endorsements become part of the user’s IBF reputation and can be referenced from their public profile.",
                ],
                [
                  "Can I search for a co-founder?",
                  "Yes. Co-founder mode adds deeper compatibility dimensions such as vision, values, commitment, equity expectations and decision-making style.",
                ],
                [
                  "Is the platform free?",
                  "You can create an account, complete a profile and explore opportunities for free. Future premium tools can be added without blocking the core collaboration experience.",
                ],
              ].map(([q, a]) => (
                <details className="faq-card" key={q}>
                  <summary>
                    {q}
                    <span>+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="px-6 py-24 section-dark">
          <div className="cta-panel max-w-6xl mx-auto relative overflow-hidden">
            <div className="cta-grid" />
            <div className="relative z-10 max-w-3xl">
              <span className="section-kicker">
                Your next build starts here
              </span>
              <h2 className="text-4xl md:text-6xl font-black leading-[1] text-white mt-5">
                The right people are closer than you think.
              </h2>
              <p className="mt-6 text-slate-400 max-w-xl leading-7">
                Create your profile, meet your strongest matches and start
                building something that matters.
              </p>
              <Link
                href="/auth/signup"
                className="cyber-btn cyber-btn-primary mt-8"
              >
                Join IBF for free <ArrowRight size={17} />
              </Link>
            </div>
            <div className="cta-symbol">✦</div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/[.07] bg-[#0a0f1e]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
          <div>
            <div className="flex items-center gap-2 text-xl font-black">
              <span className="h-9 w-9 rounded-lg bg-cyan-300 text-slate-950 grid place-items-center">
                ✦
              </span>
              IBF
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              The intelligent collaboration network for founders and emerging
              talent.
            </p>
          </div>
          <div className="md:ml-auto grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-3 text-sm text-slate-400">
            <div>
              <b className="text-white block mb-3">Platform</b>
              <Link href="/projects">Projects</Link>
              <Link href="/matches" className="block mt-2">
                Matches
              </Link>
            </div>
            <div>
              <b className="text-white block mb-3">Company</b>
              <Link href="/investors">Investors</Link>
              <a className="block mt-2">Contact</a>
            </div>
            <div>
              <b className="text-white block mb-3">Legal</b>
              <a>Privacy</a>
              <a className="block mt-2">Terms</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-5 border-t border-white/[.05] text-xs text-slate-600 flex">
          <span>© 2026 Innovator Bridge Foundry</span>
          <span className="ml-auto">Built for people who build.</span>
        </div>
      </footer>
    </div>
  );
}
