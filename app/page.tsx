'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck,
  GitBranch,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

type Project = {
  id: string;
  title: string;
  description: string;
  domain?: string | null;
  stage?: string | null;
  commitment_hours?: number | null;
  duration_weeks?: number | null;
  required_skills?: string[] | null;
};

const sampleProjects: Project[] = [
  {
    id: 'synapse-ai',
    title: 'Autonomous DICOM Imaging Triage Microservice',
    description:
      'Developing an on-premise vision inference worker to flag emergency trauma scans with under 800ms latency for community hospitals.',
    domain: 'BioTech & Health',
    stage: 'Pre-Seed · Alpha',
    commitment_hours: 12,
    duration_weeks: 8,
    required_skills: ['PyTorch', 'ONNX', 'FastAPI', 'DICOM'],
  },
  {
    id: 'aeris-energy',
    title: 'Distributed Grid State Estimator & BESS Controller',
    description:
      'Real-time frequency response optimization and battery energy storage dispatch algorithms for microgrid operators.',
    domain: 'CleanTech & Energy',
    stage: 'Seed · Prototype',
    commitment_hours: 15,
    duration_weeks: 10,
    required_skills: ['Rust', 'Time-Series DB', 'Control Systems'],
  },
  {
    id: 'khora-identity',
    title: 'Zero-Knowledge Proof Attestation for Cross-Border Talent',
    description:
      'Privacy-preserving verifiable credentials enabling university graduates in emerging markets to prove code contributions without NDA leakage.',
    domain: 'Cryptographic Systems',
    stage: 'Grants · Testing',
    commitment_hours: 10,
    duration_weeks: 6,
    required_skills: ['Circom', 'TypeScript', 'Cryptography'],
  },
];

const steps = [
  {
    number: '01',
    title: 'Define the brief',
    description:
      'Set out specific project outcomes, technical dependencies, and time requirements. A structured brief eliminates ambiguity from day one.',
  },
  {
    number: '02',
    title: 'Match on verified fit',
    description:
      'Connect with builders whose demonstrated skills, timezone availability, and domain interests align with your milestone schedule.',
  },
  {
    number: '03',
    title: 'Build with verified milestones',
    description:
      'Work inside a shared milestone workspace. Track deliverables, approve pull requests, and generate permanent credentials upon completion.',
  },
];

const founderPoints = [
  'Publish a structured project brief in under 5 minutes with milestone milestones.',
  'Review vetted candidates filtered by code proficiency, availability, and timezone.',
  'Automate deliverable sign-offs and issue tamper-proof completion credentials.',
  'Maintain IP clarity and NDA compliance through standard founder agreements.',
];

const builderPoints = [
  'Work directly with venture-backed and grant-funded founders on production codebases.',
  'Replace speculative unpaid work with milestone-escrowed stipends and advisory equity.',
  'Build an on-chain, verifiable portfolio of signed code and clinical/technical reviews.',
  'Receive warm investor and accelerator referrals after verified milestone delivery.',
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [activeTab, setActiveTab] = useState<'milestones' | 'deliverables' | 'team'>('milestones');

  useEffect(() => {
    let active = true;

    fetch('/api/projects')
      .then(async (response) => {
        if (!response.ok) return { projects: [] };
        return response.json();
      })
      .then((body) => {
        if (active && Array.isArray(body.projects) && body.projects.length > 0) {
          setProjects(body.projects.slice(0, 3));
        }
      })
      .catch(() => {
        // Fall back gracefully to curated sample projects
        if (active) setProjects(sampleProjects);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--base)] text-[var(--ink)] antialiased">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[var(--surface)] focus:text-[var(--ink)] focus:border focus:border-[var(--accent)]"
      >
        Skip to main content
      </a>

      {/* Hallmark N1b: Editorial masthead */}
      <div className="border-b border-[var(--hairline)] bg-[var(--surface)] py-2 text-[11px] font-mono tracking-wider text-[var(--muted)]">
        <div className="editorial-wrap flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--deep)]" aria-hidden="true" />
            SPRING 2026 COHORT · VERIFIED WORKSPACE FOR FOUNDERS &amp; BUILDERS
          </span>
          <span className="hidden sm:inline">FOUNDRY NOTEBOOK · VOL. IV</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--base)]/95 backdrop-blur-xs">
        <div className="editorial-wrap flex min-h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-[26px] font-medium tracking-tight text-[var(--ink)] hover:opacity-85 transition"
            >
              IBF
            </Link>
            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/projects">
                Projects
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="#how-it-works">
                How It Works
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="#workspace">
                Workspace
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/investors">
                Investors
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/help">
                Help
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="px-3 py-2 text-sm font-medium hover:text-[var(--accent)] transition"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-editorial text-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero section */}
        <section className="editorial-section border-b border-[var(--hairline)]">
          <div className="editorial-wrap">
            <p className="font-mono-eyebrow">INNOVATOR BRIDGE FOUNDRY</p>
            <h1 className="editorial-title mt-6 max-w-[1020px] text-[44px] sm:text-[62px] md:text-[76px] leading-[1.03] text-[var(--ink)]">
              Where founders meet the people who’ll build it with them.
            </h1>
            <p className="mt-7 max-w-[620px] text-[17px] sm:text-[19px] leading-[1.7] text-[var(--muted)]">
              IBF bridges early-stage venture founders with ambitious student engineers, researchers,
              and designers through structured project matching, milestone-based escrow, and verifiable proof of work.
            </p>

            <div className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Link href="/projects/new" className="btn-editorial">
                Post a project brief
              </Link>
              <Link href="/projects" className="btn-ghost flex items-center gap-2">
                Browse open projects <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {/* Credibility metric ribbon */}
            <div className="mt-16 pt-8 border-t border-[var(--hairline)] grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="block font-mono text-2xl sm:text-3xl font-medium text-[var(--ink)]">14 Days</span>
                <span className="font-mono-eyebrow text-[10px] text-[var(--muted)] mt-1 block">Average Match Time</span>
              </div>
              <div>
                <span className="block font-mono text-2xl sm:text-3xl font-medium text-[var(--ink)]">84%</span>
                <span className="font-mono-eyebrow text-[10px] text-[var(--muted)] mt-1 block">Milestone Completion</span>
              </div>
              <div>
                <span className="block font-mono text-2xl sm:text-3xl font-medium text-[var(--ink)]">320+</span>
                <span className="font-mono-eyebrow text-[10px] text-[var(--muted)] mt-1 block">Verified Deliverables</span>
              </div>
              <div>
                <span className="block font-mono text-2xl sm:text-3xl font-medium text-[var(--ink)]">100%</span>
                <span className="font-mono-eyebrow text-[10px] text-[var(--muted)] mt-1 block">On-Chain Credentials</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="editorial-section border-b border-[var(--hairline)]">
          <div className="editorial-wrap grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="font-mono-eyebrow">THE COLLABORATION DEFICIT</p>
              <h2 className="editorial-title mt-4 text-[32px] sm:text-[38px] leading-[1.12]">
                Founders can’t find the right builders. Students can’t find real work.
              </h2>
            </div>
            <div className="space-y-6 md:col-span-7 md:pt-4">
              <p className="editorial-copy">
                Early-stage founders spend weeks sifting through scattered LinkedIn inboxes, Discord servers, and
                unverified job board applicants. Without structured milestones or verified code portfolios, 70% of early
                collaborations stall out before the first release.
              </p>
              <p className="editorial-copy">
                Meanwhile, top engineering and science students are trapped building synthetic demo projects that no one
                ever deploys. They crave skin in the game: real architectural decisions, direct feedback from founders,
                and milestone credentials that hold weight with top tech companies and investors.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="editorial-section bg-[var(--surface)] border-b border-[var(--hairline)]">
          <div className="editorial-wrap">
            <p className="font-mono-eyebrow">THE OPERATING MODEL</p>
            <h2 className="editorial-title mt-4 text-[36px] sm:text-[44px]">
              Three steps. Clear accountability.
            </h2>

            <div className="mt-12 border-t border-[var(--hairline)]">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-4 border-b border-[var(--hairline)] py-9 md:grid-cols-[120px_260px_1fr] md:items-start md:gap-10"
                >
                  <span className="font-display text-[44px] font-medium leading-none text-[var(--muted)]">
                    {step.number}
                  </span>
                  <h3 className="font-display text-[22px] font-medium leading-[1.25]">
                    {step.title}
                  </h3>
                  <p className="editorial-copy max-w-[620px]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Authentic Workspace Specimen (Replacing the 420px placeholder box) */}
        <section id="workspace" className="editorial-section border-b border-[var(--hairline)]">
          <div className="editorial-wrap">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-mono-eyebrow">COLLABORATIVE SPECIMEN</p>
                <h2 className="editorial-title mt-4 text-[36px] sm:text-[44px]">
                  Built for the work that matters.
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)] max-w-lg">
                  Every project in IBF operates inside a dedicated milestone environment with verifiable deliverables.
                </p>
              </div>

              {/* Specimen tab switch */}
              <div className="flex items-center gap-1 bg-[var(--surface)] p-1 border border-[var(--hairline)] rounded-[2px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] transition ${
                    activeTab === 'milestones'
                      ? 'bg-[var(--base)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Milestones
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deliverables')}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] transition ${
                    activeTab === 'deliverables'
                      ? 'bg-[var(--base)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Deliverables
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] transition ${
                    activeTab === 'team'
                      ? 'bg-[var(--base)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Team Roster
                </button>
              </div>
            </div>

            {/* Specimen card */}
            <div className="mt-10 border border-[var(--hairline)] bg-[var(--surface)] rounded-[2px] shadow-sm overflow-hidden">
              {/* Specimen header bar */}
              <div className="border-b border-[var(--hairline)] bg-[var(--base)] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[2px] bg-[var(--deep)] text-[var(--base)] flex items-center justify-center font-display text-sm font-bold">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-medium text-[var(--ink)] text-base">Synapse Health</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[var(--hairline)] rounded-[2px] bg-[var(--surface)] text-[var(--muted)]">
                        Pre-Seed · BioTech
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[var(--muted)]">Stage 2 of 4: DICOM Inference Microservice</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-[var(--deep)]">
                    <ShieldCheck size={14} /> Escrow Locked: $2,500 USDC
                  </span>
                  <span className="hidden md:inline text-[var(--muted)]">·</span>
                  <span className="hidden md:flex items-center gap-1.5 text-[var(--muted)]">
                    <Clock size={14} /> Week 4 of 8
                  </span>
                </div>
              </div>

              {/* Specimen content body */}
              <div className="p-6 md:p-8">
                {activeTab === 'milestones' && (
                  <div className="space-y-4">
                    <div className="p-4 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[var(--deep)] shrink-0" />
                          <h4 className="font-display font-medium text-base text-[var(--ink)]">
                            Milestone 1: DICOM Stream Ingestion &amp; Sanitization
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1 ml-6">
                          Validated HIPAA de-identification pipeline with 50,000 synthetic scans. Delivered 2 days early.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-6 md:ml-0 font-mono text-[11px]">
                        <span className="px-2.5 py-1 bg-[#E4ECE7] text-[var(--deep)] rounded-[2px] font-medium">
                          VERIFIED
                        </span>
                        <span className="text-[var(--muted)]">IBF-CERT-8841</span>
                      </div>
                    </div>

                    <div className="p-4 border-2 border-[var(--accent)] bg-[var(--base)] rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin shrink-0" />
                          <h4 className="font-display font-medium text-base text-[var(--ink)]">
                            Milestone 2: Vision Transformer Inference Microservice
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1 ml-6">
                          Target: &lt;800ms latency on TensorRT runtime. Current benchmark: 640ms with 99.4% ROC-AUC on test split.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-6 md:ml-0 font-mono text-[11px]">
                        <span className="px-2.5 py-1 bg-[var(--accent)] text-white rounded-[2px] font-medium">
                          IN REVIEW
                        </span>
                        <span className="text-[var(--muted)]">PR #38 · 3 Reviewers</span>
                      </div>
                    </div>

                    <div className="p-4 border border-[var(--hairline)] bg-[var(--base)]/60 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3 opacity-75">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-[var(--muted)] shrink-0" />
                          <h4 className="font-display font-medium text-base text-[var(--ink)]">
                            Milestone 3: Clinical Review UI &amp; Audit Trail
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1 ml-6">
                          Frontend radiologist workflow in Next.js + Tailwind with emergency notification webhooks.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-6 md:ml-0 font-mono text-[11px] text-[var(--muted)]">
                        <span>QUEUED · WEEK 6</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'deliverables' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[var(--muted)] uppercase tracking-wider">Artifact #1</span>
                        <span className="font-mono text-[10px] bg-[#E4ECE7] text-[var(--deep)] px-2 py-0.5 rounded-[2px]">Signed</span>
                      </div>
                      <h4 className="font-display font-medium text-base text-[var(--ink)] mt-2">
                        onnx-tensorrt-worker-v1.4.tar.gz
                      </h4>
                      <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                        SHA-256: <code className="font-mono text-[10px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                      </p>
                      <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                        <span className="text-[var(--muted)]">Reviewer: Dr. Aris Thorne</span>
                        <span className="font-mono text-[var(--deep)] font-medium">99.4% ROC-AUC</span>
                      </div>
                    </div>

                    <div className="p-5 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[var(--muted)] uppercase tracking-wider">Artifact #2</span>
                        <span className="font-mono text-[10px] bg-[var(--surface)] text-[var(--muted)] px-2 py-0.5 rounded-[2px]">Pending Review</span>
                      </div>
                      <h4 className="font-display font-medium text-base text-[var(--ink)] mt-2">
                        dicom-sanitization-spec-v2.pdf
                      </h4>
                      <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                        Comprehensive architectural audit document with compliance checklist for Institutional Review Board (IRB).
                      </p>
                      <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                        <span className="text-[var(--muted)]">Author: Priya Sharma</span>
                        <span className="font-mono text-[var(--accent)] font-medium">Under Peer Review</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]">
                      <div className="w-10 h-10 rounded-[2px] bg-[var(--hairline)] flex items-center justify-center font-display font-medium text-[var(--ink)] text-sm">
                        MC
                      </div>
                      <h4 className="font-display font-medium text-base text-[var(--ink)] mt-3">Marcus Chen</h4>
                      <p className="font-mono text-xs text-[var(--muted)]">Founder &amp; Bioinformatician</p>
                      <p className="text-xs text-[var(--muted)] mt-2">Stanford PhD Candidate · Full-time</p>
                    </div>

                    <div className="p-4 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]">
                      <div className="w-10 h-10 rounded-[2px] bg-[#E4ECE7] text-[var(--deep)] flex items-center justify-center font-display font-medium text-sm">
                        PS
                      </div>
                      <h4 className="font-display font-medium text-base text-[var(--ink)] mt-3">Priya Sharma</h4>
                      <p className="font-mono text-xs text-[var(--deep)] font-medium">Lead ML Engineer</p>
                      <p className="text-xs text-[var(--muted)] mt-2">CMU Masters · 15 hrs/week · 0.75% Equity</p>
                    </div>

                    <div className="p-4 border border-[var(--hairline)] bg-[var(--base)] rounded-[2px]">
                      <div className="w-10 h-10 rounded-[2px] bg-[#FDF1EE] text-[var(--accent)] flex items-center justify-center font-display font-medium text-sm">
                        LO
                      </div>
                      <h4 className="font-display font-medium text-base text-[var(--ink)] mt-3">Lucas Ortiz</h4>
                      <p className="font-mono text-xs text-[var(--accent)] font-medium">Distributed Systems Lead</p>
                      <p className="text-xs text-[var(--muted)] mt-2">MIT Senior · 12 hrs/week · $1.5k USDC</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Specimen footer */}
              <div className="border-t border-[var(--hairline)] bg-[var(--base)]/80 px-6 py-3 text-xs font-mono text-[var(--muted)] flex items-center justify-between">
                <span>Verified by IBF Cryptographic Attestation Engine</span>
                <Link href="/auth/signup" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                  Start your project workspace <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dual column: For Founders vs For Builders */}
        <section className="border-b border-[var(--hairline)]">
          <div className="editorial-wrap grid md:grid-cols-2">
            <article className="py-16 md:py-24 md:pr-14">
              <p className="font-mono-eyebrow">FOR FOUNDERS</p>
              <h2 className="editorial-title mt-4 max-w-[430px] text-[32px] sm:text-[36px] leading-[1.15]">
                Ship faster with the right team.
              </h2>
              <ul className="mt-8 space-y-4 text-[15px] leading-[1.65] text-[var(--muted)]">
                {founderPoints.map((point) => (
                  <li key={point} className="border-t border-[var(--hairline)] pt-4 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-4">
                <Link href="/projects/new" className="btn-editorial text-sm">
                  Post a founder brief
                </Link>
              </div>
            </article>

            <article className="border-t border-[var(--hairline)] py-16 md:border-l md:border-t-0 md:py-24 md:pl-14">
              <p className="font-mono-eyebrow">FOR BUILDERS &amp; RESEARCHERS</p>
              <h2 className="editorial-title mt-4 max-w-[430px] text-[32px] sm:text-[36px] leading-[1.15]">
                Work on things worth building.
              </h2>
              <ul className="mt-8 space-y-4 text-[15px] leading-[1.65] text-[var(--muted)]">
                {builderPoints.map((point) => (
                  <li key={point} className="border-t border-[var(--hairline)] pt-4 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep)] mt-2 shrink-0" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-4">
                <Link href="/projects" className="btn-ghost text-sm">
                  Find open projects
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Current Projects */}
        <section className="editorial-section border-b border-[var(--hairline)]">
          <div className="editorial-wrap">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-mono-eyebrow">ACTIVE COHORTS</p>
                <h2 className="editorial-title mt-4 text-[36px] sm:text-[44px]">
                  What’s being built right now.
                </h2>
              </div>
              <Link href="/projects" className="font-mono text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                View all active projects ({projects.length}) <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12 border-t border-[var(--hairline)]">
              {projects.map((project) => (
                <Link
                  href={`/projects/${project.id}`}
                  key={project.id}
                  className="group grid gap-4 border-b border-[var(--hairline)] py-8 md:grid-cols-[1fr_220px] md:gap-10 transition hover:bg-[var(--surface)]/50 -mx-4 px-4 sm:-mx-6 sm:px-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-[2px] bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)]">
                        {project.domain || 'Technology'}
                      </span>
                      {project.stage && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] text-[var(--muted)]">
                          {project.stage}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-[22px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition">
                      {project.title}
                    </h3>
                    <p className="mt-2.5 max-w-[720px] text-[15px] leading-[1.7] text-[var(--muted)]">
                      {project.description}
                    </p>
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {project.required_skills.map((skill) => (
                          <span
                            key={skill}
                            className="font-mono text-[10px] text-[var(--muted)] border border-[var(--hairline)] px-2 py-0.5 rounded-[2px] bg-[var(--base)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between md:items-end text-xs font-mono text-[var(--muted)]">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {project.commitment_hours || 10} hrs/week
                    </span>
                    <span className="mt-3 md:mt-0 inline-flex items-center gap-1 text-[var(--ink)] font-medium group-hover:translate-x-1 transition-transform">
                      Review Brief <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Closing Section (Replacing centered AI template) */}
        <section className="editorial-section bg-[var(--surface)]">
          <div className="editorial-wrap grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7 space-y-6">
              <p className="font-mono-eyebrow">THE SPRING 2026 CYCLE</p>
              <h2 className="editorial-title text-[40px] sm:text-[50px] leading-[1.08]">
                Start building with skin in the game.
              </h2>
              <p className="editorial-copy max-w-xl">
                The Foundry matches verified founders and talented builders through transparent milestone agreements.
                Stop wasting months in recruitment limbo. Create your profile, define your outcomes, and collaborate with accountability.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[var(--deep)]" /> Escrow protection
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[var(--deep)]" /> On-chain credentials
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[var(--deep)]" /> Verified founder briefs
                </span>
              </div>
            </div>

            <div className="md:col-span-5 bg-[var(--base)] border border-[var(--hairline)] rounded-[2px] p-7 shadow-sm">
              <h3 className="font-display text-xl font-medium text-[var(--ink)]">
                Ready to take the next step?
              </h3>
              <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
                Join our active cohort of over 140 founders and 800+ builders worldwide.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/auth/signup" className="btn-editorial text-center text-sm">
                  Create an account
                </Link>
                <Link href="/projects" className="btn-ghost text-center text-sm">
                  Browse open project briefs
                </Link>
              </div>
              <p className="text-[11px] font-mono text-center text-[var(--muted)] mt-4">
                No recruiter fees · Encrypted Supabase Auth
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Hallmark Ft1: Mast-headed Colophon Footer */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--base)]">
        <div className="editorial-wrap py-16">
          {/* Large editorial masthead title */}
          <div className="border-b border-[var(--hairline)] pb-10">
            <span className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--ink)]">
              INNOVATOR BRIDGE FOUNDRY
            </span>
            <p className="font-mono text-xs text-[var(--muted)] mt-3">
              Where high-conviction founders and high-agency builders unite to ship verified outcomes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-12 border-b border-[var(--hairline)]">
            <div>
              <p className="font-mono-eyebrow">Platform</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <Link href="/projects" className="hover:text-[var(--ink)] transition">Projects</Link>
                <Link href="/marketplace" className="hover:text-[var(--ink)] transition">Marketplace</Link>
                <Link href="/events" className="hover:text-[var(--ink)] transition">Events &amp; Demo Days</Link>
                <Link href="/investors" className="hover:text-[var(--ink)] transition">Investor Portal</Link>
              </div>
            </div>

            <div>
              <p className="font-mono-eyebrow">Workspaces</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <Link href="/dashboard" className="hover:text-[var(--ink)] transition">Milestone Tracking</Link>
                <Link href="/projects/new" className="hover:text-[var(--ink)] transition">Post a Brief</Link>
                <Link href="/auth/choose-role" className="hover:text-[var(--ink)] transition">Role Directory</Link>
                <Link href="/help" className="hover:text-[var(--ink)] transition">Knowledge Base</Link>
              </div>
            </div>

            <div>
              <p className="font-mono-eyebrow">Colophon</p>
              <div className="mt-4 flex flex-col gap-1.5 text-xs font-mono text-[var(--muted)] leading-relaxed">
                <span>Display: Fraunces Serif</span>
                <span>Body: Inter Sans</span>
                <span>Mono: IBM Plex Mono</span>
                <span>Edition: 2026.4 Production</span>
              </div>
            </div>

            <div>
              <p className="font-mono-eyebrow">Network &amp; Contact</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <a href="mailto:hello@innovators-global.com" className="hover:text-[var(--ink)] transition">
                  hello@innovators-global.com
                </a>
                <span className="text-xs font-mono text-[var(--deep)] flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--deep)] animate-pulse" aria-hidden="true" />
                  Systems fully operational
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[var(--muted)]">
            <p>© 2026 Innovator Bridge Foundry. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/help" className="hover:text-[var(--ink)] transition">Privacy Policy</Link>
              <Link href="/help" className="hover:text-[var(--ink)] transition">Terms of Service</Link>
              <Link href="/help" className="hover:text-[var(--ink)] transition">Attestation Spec</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
