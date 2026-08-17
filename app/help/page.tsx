"use client";
import AppShell from "@/components/AppShell";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
type Article = {
  category: string;
  title: string;
  desc: string;
  steps: string[];
};
const articles: Article[] = [
  {
    category: "Getting started",
    title: "Create and complete your IBF profile",
    desc: "Set up a role-aware profile and improve the quality of your matches.",
    steps: [
      "Choose Founder or Student during registration.",
      "Add a clear bio, skills, domain interests and weekly availability.",
      "Founders should describe their company, startup stage and current needs.",
      "Keep your profile current—matching uses this information in real time.",
    ],
  },
  {
    category: "Projects",
    title: "Publish a startup project",
    desc: "Create a real project and make it discoverable to matching talent.",
    steps: [
      "Open Projects and choose Submit project.",
      "Describe the problem, solution, stage and expected duration.",
      "Add the exact skills and weekly commitment you need.",
      "Publish the project; it will appear in the live directory and match feed.",
    ],
  },
  {
    category: "Projects",
    title: "Apply and manage applicants",
    desc: "Understand applications, connection requests and applicant status.",
    steps: [
      "Open a project and review requirements before applying.",
      "Send a concise connection request explaining your fit.",
      "Founders can accept or reject pending requests from their dashboard.",
      "An accepted connection unlocks private collaboration tools.",
    ],
  },
  {
    category: "Collaboration",
    title: "Connections and private chat",
    desc: "Move from a match to a trusted one-to-one conversation.",
    steps: [
      "Send a connection request from a compatible project or profile.",
      "The recipient receives an in-app notification.",
      "After acceptance, open Messages to start a private conversation.",
      "Use the team room after collaborators formally join a project.",
    ],
  },
  {
    category: "Matching",
    title: "How match scores are calculated",
    desc: "Learn how skills, domain, availability and engagement affect ranking.",
    steps: [
      "Required-skill overlap contributes 40% of the score.",
      "Domain and interest alignment contributes 30%.",
      "Weekly availability compatibility contributes 20%.",
      "Engagement preference contributes 10%. Match reasons explain the result.",
    ],
  },
  {
    category: "Workspace",
    title: "Teams, channels and milestones",
    desc: "Organize project communication, ownership and delivery dates.",
    steps: [
      "Open the project team room after joining the project.",
      "Use focused channels for general, development, design and marketing work.",
      "Create milestones with owners, due dates and clear definitions of done.",
      "Review progress in meetings and close completed milestones.",
    ],
  },
  {
    category: "Reputation",
    title: "Reviews and skill endorsements",
    desc: "Turn completed work into trusted professional evidence.",
    steps: [
      "Complete meaningful project work before requesting a review.",
      "Project collaborators can leave a rating and written feedback.",
      "Teammates can endorse specific demonstrated skills.",
      "Your average rating and endorsements appear on your public profile.",
    ],
  },
  {
    category: "Account",
    title: "Account, notifications and security",
    desc: "Manage profile preferences, alerts, password and active session.",
    steps: [
      "Open Settings from the sidebar.",
      "Use Profile to update matching information.",
      "Use Notifications to control connection, message and email alerts.",
      "Use Security to change your password or sign out.",
    ],
  },
];
const faqs = [
  [
    "Why can’t I submit a project?",
    "Project creation is intended for Founder accounts. If you registered as a Student, create a founder account or contact support to request a role change.",
  ],
  [
    "Why are there no matches yet?",
    "Complete your skills, interests and availability. Matches also require founders to publish open projects with required skills.",
  ],
  [
    "Why did Google or GitHub login fail?",
    "Social login only works after that provider is enabled with valid OAuth credentials in Supabase. Email/password login remains available.",
  ],
  [
    "Why is my bookmark list empty?",
    "Bookmarks now use real database records. Save a live project or profile first; old demonstration cards are no longer shown.",
  ],
  [
    "How do I report a safety problem?",
    "Contact support with the user, project and relevant message details. Do not share passwords, access tokens or sensitive documents.",
  ],
];
const categories = [
  "All",
  ...Array.from(new Set(articles.map((a) => a.category))),
];
export default function Help() {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("All"),
    [selected, setSelected] = useState<Article | null>(null);
  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (category === "All" || a.category === category) &&
          (a.title + a.desc + a.category + a.steps.join(" "))
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [q, category],
  );
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <section className="text-center py-10">
          <span className="h-12 w-12 mx-auto rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
            <HelpCircle />
          </span>
          <p className="mt-5 text-[10px] tracking-[.2em] text-cyan-300 font-bold">
            IBF KNOWLEDGE BASE
          </p>
          <h1 className="text-3xl md:text-5xl font-black mt-2">
            How can we help?
          </h1>
          <p className="text-slate-500 mt-3">
            Guides and answers for every part of the collaboration journey.
          </p>
          <label className="relative block max-w-2xl mx-auto mt-8">
            <Search
              className="absolute left-4 top-3.5 text-slate-500"
              size={18}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="field pl-11 py-3.5"
              placeholder="Search projects, matching, chat, security…"
            />
          </label>
        </section>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {categories.map((c) => (
            <button
              onClick={() => setCategory(c)}
              className={`pill whitespace-nowrap ${category === c ? "bg-slate-900" : "bg-white border border-slate-200 text-slate-400"}`}
              key={c}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center mt-7 mb-4">
          <h2 className="font-bold">Help articles</h2>
          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        {filtered.length ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((a) => (
              <button
                onClick={() => setSelected(a)}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start group text-left hover:border-cyan-300/25"
                key={a.title}
              >
                <span className="h-11 w-11 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                  <BookOpen size={18} />
                </span>
                <div className="ml-4">
                  <span className="text-[9px] tracking-widest text-cyan-300 font-bold">
                    {a.category.toUpperCase()}
                  </span>
                  <h3 className="font-bold mt-1 group-hover:text-cyan-300 transition">
                    {a.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-6">
                    {a.desc}
                  </p>
                </div>
                <ChevronRight
                  className="ml-auto mt-2 text-slate-600 group-hover:text-cyan-300 group-hover:translate-x-1 transition"
                  size={17}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <Search className="mx-auto text-slate-600" />
            <h2 className="font-bold mt-4">No matching help articles</h2>
            <button
              onClick={() => {
                setQ("");
                setCategory("All");
              }}
              className="text-cyan-300 text-sm font-bold mt-3"
            >
              Clear search
            </button>
          </div>
        )}
        <section className="mt-14">
          <div className="text-center">
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              QUICK ANSWERS
            </p>
            <h2 className="text-2xl font-black mt-2">
              Frequently asked questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto mt-7 space-y-2">
            {faqs.map(([question, answer]) => (
              <details className="faq-card" key={question}>
                <summary>
                  {question}
                  <ChevronDown className="ml-auto text-cyan-300" size={17} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="grid md:grid-cols-3 gap-4 mt-14">
          <div className="p-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04]">
            <MessageCircle className="text-cyan-300" />
            <h2 className="font-bold mt-4">Community support</h2>
            <p className="text-sm text-slate-500 mt-2 leading-6">
              Ask founders and builders in the community room.
            </p>
            <a href="/chat/general" className="audience-link">
              Open community chat <ArrowRight size={14} />
            </a>
          </div>
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[.02]">
            <Mail className="text-amber-300" />
            <h2 className="font-bold mt-4">Email support</h2>
            <p className="text-sm text-slate-500 mt-2 leading-6">
              Get help with account, safety or partnership questions.
            </p>
            <a
              href="mailto:support@ibfinnovator.ai?subject=IBF%20Support%20Request"
              className="audience-link"
            >
              Contact support <ArrowRight size={14} />
            </a>
          </div>
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[.02]">
            <ShieldCheck className="text-cyan-300" />
            <h2 className="font-bold mt-4">Trust and safety</h2>
            <p className="text-sm text-slate-500 mt-2 leading-6">
              Report suspicious profiles, projects or messages.
            </p>
            <a
              href="mailto:safety@ibfinnovator.ai?subject=IBF%20Safety%20Report"
              className="audience-link"
            >
              Report a concern <ArrowRight size={14} />
            </a>
          </div>
        </section>
        {selected && (
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex justify-end"
          >
            <article
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-xl bg-[#0d1322] border-l border-white/10 p-6 md:p-9 overflow-y-auto"
            >
              <button
                onClick={() => setSelected(null)}
                className="float-right h-9 w-9 rounded-lg border border-white/10 grid place-items-center text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
              <span className="feature-icon">
                <BookOpen />
              </span>
              <p className="text-[10px] tracking-[.18em] text-cyan-300 font-bold mt-7">
                {selected.category.toUpperCase()}
              </p>
              <h2 className="text-3xl font-black mt-2">{selected.title}</h2>
              <p className="text-slate-400 leading-7 mt-4">{selected.desc}</p>
              <div className="mt-8 space-y-4">
                {selected.steps.map((s, i) => (
                  <div className="flex gap-3 p-4 rounded-xl border border-white/[.07] bg-white/[.02]">
                    <span className="h-7 w-7 shrink-0 rounded-full bg-cyan-300 text-slate-950 grid place-items-center text-xs font-black">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-300 leading-6">{s}</p>
                  </div>
                ))}
              </div>
              <div className="mt-9 p-5 rounded-xl bg-cyan-300/[.06] border border-cyan-300/15">
                <Sparkles className="text-cyan-300" size={18} />
                <b className="block mt-3">Still need help?</b>
                <p className="text-sm text-slate-500 mt-2">
                  Contact support and include the page URL plus a screenshot of
                  the problem.
                </p>
                <a
                  href="mailto:support@ibfinnovator.ai"
                  className="btn btn-primary mt-4"
                >
                  Email support
                </a>
              </div>
            </article>
          </div>
        )}
      </div>
    </AppShell>
  );
}
