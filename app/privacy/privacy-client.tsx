"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Printer,
  RefreshCw,
  Search,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

type JurisdictionFilter = "all" | "gdpr" | "ccpa" | "dpdp" | "cookies" | "rights";

interface ClauseSection {
  id: string;
  number: string;
  title: string;
  category: JurisdictionFilter[];
  summary: string;
}

const SECTIONS: ClauseSection[] = [
  {
    id: "scope-entity",
    number: "01",
    title: "Organization, Scope & Definitions",
    category: ["all", "gdpr", "ccpa", "dpdp"],
    summary: "Legal entities, governance scope across web, workspaces, and mobile portals.",
  },
  {
    id: "principles",
    number: "02",
    title: "Core Privacy Principles & Data Stewardship",
    category: ["all"],
    summary: "Our foundational commitment: zero ad-brokerage, minimization, and user sovereignty.",
  },
  {
    id: "data-collected",
    number: "03",
    title: "Categories of Information We Collect",
    category: ["all", "gdpr", "ccpa", "dpdp"],
    summary: "Details of directly provided data, automated telemetry, and OAuth integrations.",
  },
  {
    id: "lawful-bases",
    number: "04",
    title: "Lawful Bases for Processing (GDPR Art. 6)",
    category: ["all", "gdpr"],
    summary: "Contractual necessity, legitimate business interests, statutory duty, and consent.",
  },
  {
    id: "how-we-use",
    number: "05",
    title: "Purposes of Processing & Platform Operations",
    category: ["all", "gdpr", "ccpa", "dpdp"],
    summary: "Facilitating match discovery, milestone delivery, reputation, and security defense.",
  },
  {
    id: "matching-ai",
    number: "06",
    title: "Algorithmic Matching & Automated Safeguards",
    category: ["all", "gdpr"],
    summary: "Mathematical matching transparency with strict human autonomy over every connection.",
  },
  {
    id: "sharing-disclosures",
    number: "07",
    title: "Data Disclosures & Verified Sub-processors",
    category: ["all", "gdpr", "ccpa"],
    summary: "Certified infrastructure partners: Supabase, Sentry, Resend, Cloudflare, Stripe.",
  },
  {
    id: "no-sale-notice",
    number: "08",
    title: "Absolute Prohibition on Sale of Personal Data",
    category: ["all", "ccpa"],
    summary: "Notice under CCPA/CPRA: We do not sell or share data for behavioral advertising.",
  },
  {
    id: "transfers",
    number: "09",
    title: "Cross-Border Data Transfers & Safeguards",
    category: ["all", "gdpr"],
    summary: "Standard Contractual Clauses (SCCs), UK IDTA, and cryptographic transit security.",
  },
  {
    id: "retention",
    number: "10",
    title: "Data Retention Schedules & Storage Lifecycles",
    category: ["all", "gdpr", "dpdp"],
    summary: "Active tenure, 90-day transient log rotation, and backup pruning policies.",
  },
  {
    id: "self-service-tools",
    number: "11",
    title: "Self-Service Erasure & Data Portability Tools",
    category: ["all", "gdpr", "ccpa", "dpdp", "rights"],
    summary: "Direct execution: One-click JSON data export and permanent account deletion.",
  },
  {
    id: "jurisdiction-rights",
    number: "12",
    title: "Statutory Privacy Rights by Jurisdiction",
    category: ["all", "gdpr", "ccpa", "dpdp", "rights"],
    summary: "Specific provisions for EEA & UK (GDPR), California (CPRA), and India (DPDP Act).",
  },
  {
    id: "cookies-telemetry",
    number: "13",
    title: "Cookies & Tracking Technologies Policy",
    category: ["all", "cookies"],
    summary: "Full disclosure of essential session tokens, presence cookies, and browser controls.",
  },
  {
    id: "minors-safety",
    number: "14",
    title: "Protection of Minors & Higher-Ed Governance",
    category: ["all", "gdpr", "ccpa", "dpdp"],
    summary: "Age 18+ policy, university collaboration rules, and COPPA strict non-collection.",
  },
  {
    id: "security-toms",
    number: "15",
    title: "Technical & Organizational Security Measures",
    category: ["all", "gdpr", "dpdp"],
    summary: "PostgreSQL Row-Level Security, TLS 1.3, AES-256 at rest, and CSRF protection.",
  },
  {
    id: "breach-protocol",
    number: "16",
    title: "Security Incident & Breach Notification Protocol",
    category: ["all", "gdpr", "dpdp"],
    summary: "72-hour regulatory disclosure commitment and direct user notification standards.",
  },
  {
    id: "grievance-contacts",
    number: "17",
    title: "Data Protection Officer & Grievance Redressal",
    category: ["all", "gdpr", "ccpa", "dpdp"],
    summary: "Direct DPO and Grievance Officer contacts, resolution SLA, and supervisory escalation.",
  },
  {
    id: "revisions",
    number: "18",
    title: "Amendments, Version History & Notifications",
    category: ["all"],
    summary: "Version 2026.2 release log, advance notice protocol, and archive accessibility.",
  },
];

export default function PrivacyPolicyClient() {
  const [activeSection, setActiveSection] = useState<string>("scope-entity");
  const [filter, setFilter] = useState<JurisdictionFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Filter sections based on tab and search
  const filteredSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      const matchesFilter = filter === "all" || s.category.includes(filter);
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copySectionUrl = (id: string) => {
    const url = `${window.location.origin}/privacy#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[var(--base)] text-[var(--ink)] antialiased selection:bg-[var(--surface)] selection:text-[var(--ink)]">
      {/* Skip to Content for a11y */}
      <a
        href="#privacy-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[var(--surface)] focus:text-[var(--ink)] focus:border focus:border-[var(--accent)]"
      >
        Skip to privacy policy content
      </a>

      {/* Hallmark N1b: Editorial masthead */}
      <div className="border-b border-[var(--hairline)] bg-[var(--surface)] py-2 text-[11px] font-mono tracking-wider text-[var(--muted)] print:hidden">
        <div className="editorial-wrap flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--deep)]" aria-hidden="true" />
            STATUTORY DATA PROTECTION COMPLIANCE · ISO/IEC 27701 &amp; PRIVACY-BY-DESIGN
          </span>
          <span className="hidden sm:inline">VERSION 2026.2 · LEGAL ED.</span>
        </div>
      </div>

      {/* Primary Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--base)]/95 backdrop-blur-xs print:hidden">
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
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/#how-it-works">
                How It Works
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/#workspace">
                Workspace
              </Link>
              <Link className="font-mono-eyebrow hover:text-[var(--ink)] transition" href="/help">
                Help
              </Link>
              <span className="font-mono-eyebrow text-[var(--accent)] border-b border-[var(--accent)] pb-0.5">
                Privacy Policy
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              aria-label="Print this privacy policy"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[var(--hairline)] hover:border-[var(--ink)] transition rounded-[2px]"
            >
              <Printer size={13} aria-hidden="true" />
              <span>Print PDF</span>
            </button>
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

      {/* Main Container */}
      <main id="privacy-content" className="pb-24">
        {/* Document Header Section */}
        <section className="editorial-section border-b border-[var(--hairline)] bg-[var(--surface)]/30">
          <div className="editorial-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono-eyebrow text-[var(--accent)]">
                STATUTORY DISCLOSURE &amp; DATA CHARTER
              </span>
              <span className="text-[var(--hairline)]">·</span>
              <span className="font-mono text-xs text-[var(--muted)]">REV 2026.2</span>
              <span className="text-[var(--hairline)]">·</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--surface)] border border-[var(--hairline)] text-[11px] font-mono text-[var(--deep)] rounded-[2px]">
                <ShieldCheck size={12} className="text-[var(--deep)]" /> Active &amp; Enforceable
              </span>
            </div>

            <h1 className="editorial-title mt-6 max-w-[980px] text-[36px] sm:text-[50px] md:text-[64px] text-[var(--ink)]">
              Privacy Policy &amp; Data Stewardship Charter
            </h1>

            <p className="mt-6 max-w-[820px] text-[17px] sm:text-[19px] leading-[1.7] text-[var(--muted)]">
              This charter governs how <b>Innovator Bridge Foundry, Inc.</b> (&ldquo;The Innovators&rdquo;, &ldquo;IBF&rdquo;, &ldquo;innovators.ai&rdquo;) 
              collects, processes, safeguards, and respects personal data across our matching engine, private workspaces, 
              and verifiable credential infrastructure.
            </p>

            {/* Quick Metadata Bar */}
            <div className="mt-10 pt-6 border-t border-[var(--hairline)] grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-mono">
              <div>
                <span className="block text-[var(--muted)] uppercase tracking-wider text-[10px]">
                  Effective Date
                </span>
                <span className="block text-[var(--ink)] font-semibold mt-1">October 21, 2026</span>
              </div>
              <div>
                <span className="block text-[var(--muted)] uppercase tracking-wider text-[10px]">
                  Governing Entities
                </span>
                <span className="block text-[var(--ink)] font-semibold mt-1">GDPR · CCPA/CPRA · DPDP</span>
              </div>
              <div>
                <span className="block text-[var(--muted)] uppercase tracking-wider text-[10px]">
                  Data Controller
                </span>
                <span className="block text-[var(--ink)] font-semibold mt-1">Innovator Bridge Foundry</span>
              </div>
              <div>
                <span className="block text-[var(--muted)] uppercase tracking-wider text-[10px]">
                  DPO Inquiries
                </span>
                <a
                  href="mailto:dpo@innovators-global.com"
                  className="block text-[var(--accent)] font-semibold mt-1 hover:underline"
                >
                  dpo@innovators-global.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Executive Summary Cards: The 4 Core Guarantees */}
        <section className="py-12 border-b border-[var(--hairline)] bg-[var(--base)]">
          <div className="editorial-wrap">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="font-mono-eyebrow">EXECUTIVE SUMMARY</p>
                <h2 className="font-display text-2xl text-[var(--ink)] mt-1">
                  Our Four Sovereign Data Commitments
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] font-mono max-w-sm">
                Plain English principles binding our legal, engineering, and operational teams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Guarantee 1 */}
              <div className="p-6 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent)] mb-4">
                    <ShieldAlert size={18} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                    Zero Data Selling
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    We never sell, rent, license, or monetize your personal information or code briefs to third-party ad brokers or cross-context behavioral networks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--hairline)]/60 text-[11px] font-mono text-[var(--deep)] flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Strict CCPA/CPRA Compliance
                </div>
              </div>

              {/* Guarantee 2 */}
              <div className="p-6 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent)] mb-4">
                    <Trash2 size={18} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                    Self-Service Erasure
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    You can permanently erase your entire profile, messages, and project associations directly inside Settings with immediate de-identification.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--hairline)]/60 text-[11px] font-mono text-[var(--deep)] flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> GDPR Art. 17 &ldquo;Right to be Forgotten&rdquo;
                </div>
              </div>

              {/* Guarantee 3 */}
              <div className="p-6 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent)] mb-4">
                    <Download size={18} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                    Portable JSON Export
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Download an exhaustive, machine-readable JSON archive of all profile credentials, review records, milestones, and submissions at any time.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--hairline)]/60 text-[11px] font-mono text-[var(--deep)] flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> GDPR Art. 20 Portability
                </div>
              </div>

              {/* Guarantee 4 */}
              <div className="p-6 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-[2px] bg-[var(--base)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent)] mb-4">
                    <Lock size={18} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                    Defense-in-Depth
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    PostgreSQL kernel-level Row-Level Security (RLS) ensures tenant isolation; AES-256 encryption at rest and mandatory TLS 1.3 in transit.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--hairline)]/60 text-[11px] font-mono text-[var(--deep)] flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Strict Cryptographic Isolation
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Controls Bar: Jurisdiction Filter & Search */}
        <section className="sticky top-16 z-30 border-b border-[var(--hairline)] bg-[var(--base)]/95 backdrop-blur-xs py-3.5 print:hidden">
          <div className="editorial-wrap flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-[10px] font-mono uppercase text-[var(--muted)] mr-2 flex items-center gap-1">
                <Filter size={12} /> Focus:
              </span>
              {(
                [
                  { id: "all", label: "All Clauses" },
                  { id: "gdpr", label: "GDPR / EU & UK" },
                  { id: "ccpa", label: "California CCPA/CPRA" },
                  { id: "dpdp", label: "India DPDP Act" },
                  { id: "cookies", label: "Cookies & Telemetry" },
                  { id: "rights", label: "Rights & Deletion" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-[2px] transition whitespace-nowrap cursor-pointer ${
                    filter === tab.id
                      ? "bg-[var(--accent)] text-[var(--base)] font-semibold"
                      : "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--hairline)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* In-Policy Search Input */}
            <div className="relative w-full md:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policy clauses..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-2 focus:outline-[var(--accent)] focus:border-transparent font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Main Document Body Layout (2 Columns: Sticky TOC + Legal Text) */}
        <div className="editorial-wrap pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sticky Left Column: Table of Contents & Self-Service Card */}
            <aside className="lg:col-span-4 print:hidden">
              <div className="sticky top-32 space-y-6">
                {/* Table of Contents Card */}
                <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                    <p className="font-mono-eyebrow text-[10px]">TABLE OF CONTENTS</p>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {filteredSections.length} of {SECTIONS.length}
                    </span>
                  </div>

                  <nav
                    aria-label="Privacy Policy Clauses"
                    className="mt-3 max-h-[50vh] overflow-y-auto space-y-1 pr-1 text-xs"
                  >
                    {filteredSections.map((sec) => {
                      const isActive = activeSection === sec.id;
                      return (
                        <a
                          key={sec.id}
                          href={`#${sec.id}`}
                          onClick={() => setActiveSection(sec.id)}
                          className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded-[2px] transition ${
                            isActive
                              ? "bg-[var(--base)] text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)]"
                              : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--base)]/50"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-[var(--muted)] pt-0.5">
                            {sec.number}
                          </span>
                          <span className="leading-snug">{sec.title}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Self-Service Privacy Toolkit Card */}
                <div className="p-5 bg-[var(--base)] border border-[var(--hairline)] rounded-[2px]">
                  <p className="font-mono-eyebrow text-[10px] text-[var(--accent)]">
                    SELF-SERVICE TOOLKIT
                  </p>
                  <h4 className="font-display text-sm font-medium mt-1 text-[var(--ink)]">
                    Exercise Your Data Sovereignty
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Authenticated members can immediately inspect, export, or delete account records without waiting for support review.
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href="/api/account"
                      className="btn-ghost flex items-center justify-between text-xs py-2 px-3"
                    >
                      <span className="flex items-center gap-2">
                        <Download size={13} /> Download JSON Data
                      </span>
                      <ArrowUpRight size={13} className="text-[var(--muted)]" />
                    </a>
                    <Link
                      href="/settings"
                      className="btn-ghost flex items-center justify-between text-xs py-2 px-3"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 size={13} className="text-red-600" /> Account Erasure
                      </span>
                      <ChevronRight size={13} className="text-[var(--muted)]" />
                    </Link>
                  </div>
                </div>

                {/* Contact Data Protection Officer */}
                <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] text-xs">
                  <p className="font-mono-eyebrow text-[10px]">PRIVACY OFFICE</p>
                  <p className="font-medium text-[var(--ink)] mt-1">
                    Have a statutory request or audit inquiry?
                  </p>
                  <div className="mt-3 space-y-1.5 font-mono text-[11px] text-[var(--muted)]">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-[var(--accent)]" />
                      <a href="mailto:privacy@innovators-global.com" className="hover:underline">
                        privacy@innovators-global.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyRound size={12} className="text-[var(--accent)]" />
                      <a href="mailto:dpo@innovators-global.com" className="hover:underline">
                        dpo@innovators-global.com
                      </a>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-[var(--muted)] pt-3 border-t border-[var(--hairline)]">
                    Statutory response SLA: <b>&le; 30 calendar days</b> (free of charge).
                  </p>
                </div>
              </div>
            </aside>

            {/* Right Column: Full Statutory Clauses */}
            <article className="lg:col-span-8 space-y-16">
              {/* Clause 1 */}
              <section id="scope-entity" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">01</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Organization, Scope &amp; Definitions
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("scope-entity")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "scope-entity" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    This Privacy Policy (&ldquo;Policy&rdquo;) establishes the legal and technical commitments of <b>Innovator Bridge Foundry, Inc.</b>, 
                    a Delaware corporation, operating globally as <b>The Innovators</b> (&ldquo;IBF&rdquo;, &ldquo;innovators.ai&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), 
                    in its capacity as the Data Controller under applicable international data protection legislation.
                  </p>
                  <p>
                    This Policy applies unconditionally to all individuals who access, interact with, or register on:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-[var(--muted)]">
                    <li>
                      Our marketing apex portal (<code>https://innovators-global.com</code> and <code>https://innovators.ai</code>);
                    </li>
                    <li>
                      Our authenticated collaborative workspace and matching application (<code>https://app.innovators-global.com</code>);
                    </li>
                    <li>
                      Our application programming interfaces (APIs), software development kits (SDKs), background workers, and email notification conduits;
                    </li>
                    <li>
                      All project spaces, milestone tracking rooms, private messaging channels, and verifiable credential registries managed by IBF.
                    </li>
                  </ul>
                  <p>
                    For the purposes of this document, a &ldquo;Founder&rdquo; refers to any individual or organization publishing project briefs or seeking talent; 
                    a &ldquo;Builder&rdquo; or &ldquo;Student&rdquo; refers to engineers, designers, researchers, or talent applying to or collaborating on projects; 
                    and a &ldquo;User&rdquo; refers collectively to any visitor, registrant, mentor, or investor on the platform.
                  </p>
                </div>
              </section>

              {/* Clause 2 */}
              <section id="principles" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">02</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Core Privacy Principles &amp; Data Stewardship
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("principles")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "principles" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    Innovator Bridge Foundry is architected upon the doctrine of <b>Data Sovereignty and Minimal Ingestion</b>. 
                    We reject surveillance-capitalism business models that monetize human attention or user profiles. Our operations adhere to four technical standards:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--accent)] uppercase">
                        1. Purpose Limitation
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Data collected for matchmaking, milestone delivery, or verification is never repurposed for secondary monetization, ad targeting, or commercial reselling.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--accent)] uppercase">
                        2. Data Minimization
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        We collect only fields strictly necessary to compute matching scores, manage team collaboration, verify deliverables, and issue immutable credentials.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--accent)] uppercase">
                        3. Cryptographic Partitioning
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Tenant isolation is enforced in our database kernel via PostgreSQL Row-Level Security (RLS). Cross-project data bleeding is mathematically prohibited.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--accent)] uppercase">
                        4. Transparent Processing
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Every match score calculation, reputation endorsement, and automated trigger is explainable. No black-box algorithmic discrimination is permitted.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clause 3 */}
              <section id="data-collected" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">03</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Categories of Information We Collect
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("data-collected")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "data-collected" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-5 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    In order to operate the IBF platform, we collect information across three distinct vectors:
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--surface)] border-l-2 border-[var(--accent)] rounded-[2px]">
                      <h4 className="font-display font-medium text-[var(--ink)]">
                        A. Information You Voluntarily Provide
                      </h4>
                      <ul className="mt-2 list-disc pl-5 text-xs space-y-1.5 text-[var(--muted)]">
                        <li>
                          <b>Account Credentials:</b> Full legal name, preferred username, email address, and cryptographically salted password hashes (managed via Supabase Auth Argon2/bcrypt).
                        </li>
                        <li>
                          <b>Role &amp; Identity Declaration:</b> Declared role (Founder, Builder/Student, Investor, Mentor), startup entity name, and university / educational affiliation.
                        </li>
                        <li>
                          <b>Professional Profile &amp; Bio:</b> Technical skills, self-assessed proficiency levels, domain interests (e.g. BioTech, CleanTech, Cryptography), timezone, geographic location, portfolio URLs, resume documents, and weekly commitment hours.
                        </li>
                        <li>
                          <b>Project Briefs &amp; Milestone Artifacts:</b> Problem definitions, technical architectures, milestone milestones, pull request metadata, code repository URLs, deliverable documentation, and acceptance criteria.
                        </li>
                        <li>
                          <b>Collaboration Communications:</b> In-app direct messages, team room group discussions, connection requests, meeting minutes, peer reviews, ratings, and skill endorsements.
                        </li>
                        <li>
                          <b>Financial &amp; Escrow Data:</b> For milestone stipends, bank/payout tokens handled exclusively through PCI-DSS Level 1 compliant processors (Stripe). IBF never stores raw banking card numbers or security codes.
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border-l-2 border-[var(--deep)] rounded-[2px]">
                      <h4 className="font-display font-medium text-[var(--ink)]">
                        B. Information Collected Automatically Through Telemetry
                      </h4>
                      <ul className="mt-2 list-disc pl-5 text-xs space-y-1.5 text-[var(--muted)]">
                        <li>
                          <b>Network &amp; Device Identifiers:</b> Masked IP address (used for geolocation routing and DDoS mitigation), browser type and version, operating system, and hardware architecture.
                        </li>
                        <li>
                          <b>Session Presence Heartbeat:</b> Rolling 120-second presence cookie (<code>ibf_seen</code>) used strictly to verify session freshness and active collaborator indicators.
                        </li>
                        <li>
                          <b>Application Performance &amp; Error Diagnostics:</b> Crash stack traces, network latency logs, and rendering exceptions collected via Sentry (with automated PII sanitization).
                        </li>
                        <li>
                          <b>Security Audit Trails:</b> Timestamps of sign-ins, IP address changes, credential updates, and session revocations.
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border-l-2 border-[var(--muted)] rounded-[2px]">
                      <h4 className="font-display font-medium text-[var(--ink)]">
                        C. Information from Third-Party Identity &amp; Developer Integrations
                      </h4>
                      <ul className="mt-2 list-disc pl-5 text-xs space-y-1.5 text-[var(--muted)]">
                        <li>
                          <b>OAuth Providers (GitHub, Google, LinkedIn):</b> Verified email addresses, user avatar links, and public profile identifiers upon explicit authorization.
                        </li>
                        <li>
                          <b>GitHub Code Integration:</b> When linked by a builder or founder, public commit metadata and PR verification hashes necessary to confirm milestone delivery.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clause 4 */}
              <section id="lawful-bases" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">04</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Lawful Bases for Processing (GDPR Art. 6)
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("lawful-bases")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "lawful-bases" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    Under European Union Regulation (EU) 2016/679 (&ldquo;GDPR&rdquo;) and the UK Data Protection Act 2018, 
                    every data processing activity must rest upon a recognized statutory ground. We rely on the following bases:
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[var(--hairline)] rounded-[2px]">
                      <thead className="bg-[var(--surface)] font-mono uppercase text-[10px] text-[var(--muted)]">
                        <tr>
                          <th className="p-3 border-b border-[var(--hairline)]">Processing Activity</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Legal Ground (GDPR)</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Operational Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--hairline)] text-[var(--muted)]">
                        <tr>
                          <td className="p-3 font-medium text-[var(--ink)]">Account creation, matching &amp; workspace delivery</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Article 6(1)(b) — Contract</td>
                          <td className="p-3">Necessary to execute the Terms of Service between IBF and the user.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-[var(--ink)]">Security monitoring, fraud defense &amp; CSRF protection</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Article 6(1)(f) — Legitimate Interests</td>
                          <td className="p-3">Protecting platform infrastructure, preventing malicious bot activity and unauthorized access.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-[var(--ink)]">Issuance of verifiable milestone completion credentials</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Article 6(1)(b) — Contract</td>
                          <td className="p-3">Fulfilling milestone completion contracts between founders and builders.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-[var(--ink)]">Optional marketing digests &amp; cohort announcements</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Article 6(1)(a) — Consent</td>
                          <td className="p-3">Explicit opt-in required; withdrawable at any time with one click.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-[var(--ink)]">Financial audits, tax reporting &amp; legal compliance</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Article 6(1)(c) — Legal Obligation</td>
                          <td className="p-3">Statutory duty to maintain commercial books and tax disbursement records.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Clause 5 */}
              <section id="how-we-use" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">05</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Purposes of Processing &amp; Platform Operations
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("how-we-use")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "how-we-use" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    Your personal information is processed exclusively for specified, explicit, and legitimate platform purposes:
                  </p>

                  <ul className="list-disc pl-5 space-y-2 text-[var(--muted)]">
                    <li>
                      <b>Algorithmic Match Discovery:</b> Calculating affinity coefficients between founder briefs and builder profiles based on technical skill overlap, domain relevance, weekly hourly availability, and timezone alignment.
                    </li>
                    <li>
                      <b>Collaborative Workspace Execution:</b> Provisioning private project team rooms, task management boards, milestone delivery schedules, and real-time private messaging conduits.
                    </li>
                    <li>
                      <b>Reputation &amp; Verifiable Proof-of-Work:</b> Recording objective milestone completion records, peer reviews, and skill endorsements onto permanent, verifiable builder portfolios.
                    </li>
                    <li>
                      <b>Platform Security &amp; Anomaly Detection:</b> Validating cross-origin API requests via <code>rejectCrossSiteMutation</code>, verifying authentication sessions, and mitigating abusive automated scraping.
                    </li>
                    <li>
                      <b>Communications &amp; Notifications:</b> Delivering transactional alerts regarding project applications, message notices, meeting reminders, and milestone sign-offs.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 6 */}
              <section id="matching-ai" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">06</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Algorithmic Matching &amp; Automated Safeguards
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("matching-ai")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "matching-ai" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    IBF utilizes deterministic algorithmic scoring to assist founders and builders in discovering compatible collaboration opportunities. 
                    In full compliance with <b>GDPR Article 22</b> (Automated individual decision-making, including profiling), we declare:
                  </p>

                  <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] space-y-3">
                    <h4 className="font-display text-base font-medium text-[var(--ink)]">
                      Transparent Match Formula Breakdown
                    </h4>
                    <p className="text-xs text-[var(--muted)]">
                      Our ranking engine calculates compatibility using public mathematical weights:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-[var(--base)] rounded-[2px] border border-[var(--hairline)]">
                        <span className="block font-mono text-xl font-bold text-[var(--accent)]">40%</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase mt-1 block">Skill Overlap</span>
                      </div>
                      <div className="p-3 bg-[var(--base)] rounded-[2px] border border-[var(--hairline)]">
                        <span className="block font-mono text-xl font-bold text-[var(--accent)]">30%</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase mt-1 block">Domain Alignment</span>
                      </div>
                      <div className="p-3 bg-[var(--base)] rounded-[2px] border border-[var(--hairline)]">
                        <span className="block font-mono text-xl font-bold text-[var(--accent)]">20%</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase mt-1 block">Availability Hours</span>
                      </div>
                      <div className="p-3 bg-[var(--base)] rounded-[2px] border border-[var(--hairline)]">
                        <span className="block font-mono text-xl font-bold text-[var(--accent)]">10%</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase mt-1 block">Engagement Style</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    <b>Absolute Human-in-the-Loop Guarantee:</b> Match scores serve exclusively as advisory ranking filters in discovery feeds. 
                    No candidate is ever accepted, rejected, hired, or dismissed automatically by software. 
                    Every connection request and project team admission requires explicit, affirmative human review by the respective founder or builder.
                  </p>
                </div>
              </section>

              {/* Clause 7 */}
              <section id="sharing-disclosures" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">07</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Data Disclosures &amp; Verified Sub-processors
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("sharing-disclosures")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "sharing-disclosures" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    We do not share your personal information with external parties except with vetted infrastructure sub-processors under rigorous Data Processing Agreements (DPAs) 
                    incorporating EU Standard Contractual Clauses:
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[var(--hairline)] rounded-[2px]">
                      <thead className="bg-[var(--surface)] font-mono uppercase text-[10px] text-[var(--muted)]">
                        <tr>
                          <th className="p-3 border-b border-[var(--hairline)]">Sub-processor</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Purpose &amp; Scope</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Data Center Region</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Security Credentials</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--hairline)] text-[var(--muted)]">
                        <tr>
                          <td className="p-3 font-semibold text-[var(--ink)]">Supabase Inc.</td>
                          <td className="p-3">PostgreSQL relational database, authentication, and file storage.</td>
                          <td className="p-3 font-mono">AWS us-east-1 / EU Frankfurt</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">SOC 2 Type II, ISO 27001</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--ink)]">Functional Software, Inc. (Sentry)</td>
                          <td className="p-3">Application crash logging and performance telemetry (PII-scrubbed).</td>
                          <td className="p-3 font-mono">United States / EU</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">SOC 2 Type II, HIPAA compliant</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--ink)]">Resend / AWS SES</td>
                          <td className="p-3">Transactional system emails, password reset links, match alerts.</td>
                          <td className="p-3 font-mono">AWS Global Regions</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">ISO 27001, SOC 1/2/3</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--ink)]">Cloudflare, Inc.</td>
                          <td className="p-3">Edge CDN, DDoS mitigation, web application firewall (WAF).</td>
                          <td className="p-3 font-mono">Global Anycast Edge</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">SOC 2 Type II, PCI-DSS</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--ink)]">Stripe, Inc.</td>
                          <td className="p-3">Milestone stipend disbursement and escrow processing.</td>
                          <td className="p-3 font-mono">United States / Global</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">PCI-DSS Level 1 Service Provider</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    <b>Other Users on the Platform:</b> Information intentionally placed in your public portfolio (display name, public bio, skills, verified milestone badges) 
                    is discoverable by other platform members. Project rooms, milestone deliverables, and private messaging channels remain strictly restricted to accepted collaborators.
                  </p>
                </div>
              </section>

              {/* Clause 8 */}
              <section id="no-sale-notice" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">08</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Absolute Prohibition on Sale of Personal Data
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("no-sale-notice")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "no-sale-notice" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <div className="p-5 bg-[var(--surface)] border-2 border-[var(--accent)] rounded-[2px]">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
                      Statutory Notice Under California Consumer Privacy Act (CCPA / CPRA)
                    </h4>
                    <p className="mt-2 text-sm text-[var(--ink)] font-medium">
                      Innovator Bridge Foundry, Inc. does NOT sell personal information and has NOT sold personal information in the preceding 12 months. 
                      Furthermore, we do NOT share personal information with third parties for cross-context behavioral advertising.
                    </p>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    Because we categorically refuse to engage in commercial data brokerage, no &ldquo;Do Not Sell or Share My Personal Information&rdquo; opt-out 
                    is technically necessary; our platform is designed from the kernel up to exclude ad tracking pixels, third-party remarketing scripts, and behavioral cookies.
                  </p>
                </div>
              </section>

              {/* Clause 9 */}
              <section id="transfers" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">09</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Cross-Border Data Transfers &amp; Safeguards
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("transfers")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "transfers" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    IBF operates globally, matching innovators across borders. Consequently, personal data originating from the European Economic Area (EEA), 
                    the United Kingdom, and Switzerland may be transferred to, stored, and processed in cloud facilities located in the United States and other global regions.
                  </p>
                  <p>
                    To guarantee that international transfers receive an equivalent level of protection to that afforded within the European Union, we execute:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--muted)]">
                    <li>
                      <b>Standard Contractual Clauses (SCCs):</b> Implementing the European Commission’s decision 2021/914 across all cross-border supplier agreements.
                    </li>
                    <li>
                      <b>UK International Data Transfer Addendum (IDTA):</b> Incorporating British Information Commissioner’s Office statutory addenda.
                    </li>
                    <li>
                      <b>Supplementary Technical Safeguards:</b> Mandatory end-to-end TLS 1.3 transit encryption, AES-256 rest encryption, and strict zero-knowledge database administrative access.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 10 */}
              <section id="retention" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">10</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Data Retention Schedules &amp; Storage Lifecycles
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("retention")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "retention" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    Personal data is retained only for as long as necessary to fulfill the operational purposes for which it was collected:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <span className="font-mono text-xs font-semibold text-[var(--ink)]">Active User Tenure</span>
                      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                        Profile, project briefs, and messages are retained for the active lifetime of your registered account.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <span className="font-mono text-xs font-semibold text-[var(--ink)]">90-Day Telemetry Purge</span>
                      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                        Raw web server access logs, diagnostic stack traces, and presence timestamps are permanently pruned every 90 days.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <span className="font-mono text-xs font-semibold text-[var(--ink)]">30-Day Erasure SLA</span>
                      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                        Upon account deletion, all personal data is severed immediately from production and purged from cold backups within 30 days.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    <b>Verifiable Completion Attestations:</b> Milestone credentials that have been attested and issued to public cryptographic ledgers 
                    remain mathematically immutable by architectural nature; however, all directly identifiable personal metadata (name, email, avatar) 
                    is permanently detached upon account erasure.
                  </p>
                </div>
              </section>

              {/* Clause 11 */}
              <section id="self-service-tools" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">11</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Self-Service Erasure &amp; Data Portability Tools
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("self-service-tools")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "self-service-tools" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    Rather than requiring protracted email back-and-forth, IBF provides production self-service primitives 
                    directly inside your workspace settings:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[var(--accent)] mb-2 font-mono text-xs font-semibold uppercase">
                          <Download size={15} /> Portability Primitives (GDPR Art. 20)
                        </div>
                        <h4 className="font-display font-medium text-base text-[var(--ink)]">
                          Export Portable JSON Archive
                        </h4>
                        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                          Generates a complete, structured JSON export comprising your profiles, published projects, applications, 
                          connection records, messages, reviews, endorsements, and milestone certificates.
                        </p>
                      </div>
                      <div className="mt-5">
                        <a
                          href="/api/account"
                          className="btn-editorial text-xs w-full justify-center"
                        >
                          Trigger Immediate Export
                        </a>
                      </div>
                    </div>

                    <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-red-600 mb-2 font-mono text-xs font-semibold uppercase">
                          <Trash2 size={15} /> Self-Service Erasure (GDPR Art. 17)
                        </div>
                        <h4 className="font-display font-medium text-base text-[var(--ink)]">
                          Permanent Account Deletion
                        </h4>
                        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                          Executes the database stored procedure <code>delete_own_account</code>, cascading deletion through your profile, 
                          private channels, session cookies, and active associations with immediate cryptographic effect.
                        </p>
                      </div>
                      <div className="mt-5">
                        <Link
                          href="/settings"
                          className="btn-ghost text-xs w-full justify-center text-red-600 border-red-300 hover:bg-red-600 hover:text-white"
                        >
                          Manage Deletion in Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clause 12 */}
              <section id="jurisdiction-rights" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">12</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Statutory Privacy Rights by Jurisdiction
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("jurisdiction-rights")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "jurisdiction-rights" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-6 text-sm leading-[1.75] text-[var(--ink)]">
                  {/* 12.1 EEA & UK */}
                  <div className="p-5 bg-[var(--surface)] border-l-2 border-[var(--deep)] rounded-[2px]">
                    <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                      12.1 European Economic Area (EEA) &amp; United Kingdom Rights
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Under GDPR and UK Data Protection Act 2018, you possess sovereign statutory entitlements:
                    </p>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                      <li>• <b>Right of Access (Art. 15):</b> Request confirmation and copies of personal data.</li>
                      <li>• <b>Right to Rectification (Art. 16):</b> Correct inaccurate or incomplete data in Settings.</li>
                      <li>• <b>Right to Erasure (Art. 17):</b> Demand permanent deletion (&ldquo;Right to be Forgotten&rdquo;).</li>
                      <li>• <b>Right to Restriction (Art. 18):</b> Suspend processing while disputes are adjudicated.</li>
                      <li>• <b>Right to Portability (Art. 20):</b> Download structured, machine-readable JSON records.</li>
                      <li>• <b>Right to Object (Art. 21):</b> Object to processing based on legitimate interests.</li>
                    </ul>
                  </div>

                  {/* 12.2 California CPRA */}
                  <div className="p-5 bg-[var(--surface)] border-l-2 border-[var(--accent)] rounded-[2px]">
                    <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                      12.2 California Consumer Privacy Rights (CCPA / CPRA)
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      For residents of the State of California under Cal. Civ. Code § 1798.100 et seq.:
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                      <li>
                        • <b>Right to Know &amp; Access:</b> You may request the categories of personal information collected, sources, business purposes, and specific pieces of data held.
                      </li>
                      <li>
                        • <b>Right to Correct:</b> You have the right to request correction of inaccurate personal information.
                      </li>
                      <li>
                        • <b>Right to Delete:</b> You have the right to request deletion of personal information collected from you.
                      </li>
                      <li>
                        • <b>Non-Discrimination Guarantee:</b> We will never discriminate against you, deny goods/services, charge different prices, or provide a lower quality of service for exercising statutory privacy rights.
                      </li>
                      <li>
                        • <b>California &ldquo;Shine the Light&rdquo; (Civ. Code § 1798.83):</b> California residents may request once per year a list of third parties to whom we disclosed personal information for direct marketing. (We disclose none).
                      </li>
                    </ul>
                  </div>

                  {/* 12.3 India DPDP */}
                  <div className="p-5 bg-[var(--surface)] border-l-2 border-[var(--muted)] rounded-[2px]">
                    <h3 className="font-display text-lg font-medium text-[var(--ink)]">
                      12.3 India Digital Personal Data Protection Act, 2023 (DPDP Act)
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      For citizens and Data Principals located within the territory of India:
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">
                      <li>• <b>Right to Information:</b> Summary of personal data being processed and identities of Data Fiduciaries.</li>
                      <li>• <b>Right to Correction &amp; Erasure:</b> Direct updating or removal of incomplete or obsolete data.</li>
                      <li>• <b>Right of Grievance Redressal:</b> Resolution of grievances by our dedicated Grievance Officer within 30 days.</li>
                      <li>• <b>Right to Nominate:</b> Designating a nominee to exercise rights in the event of death or incapacity.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Clause 13 */}
              <section id="cookies-telemetry" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">13</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Cookies &amp; Tracking Technologies Policy
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("cookies-telemetry")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "cookies-telemetry" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    We deploy a strict, minimal cookie taxonomy. We do NOT use third-party advertising cookies, cross-site trackers, 
                    or device-fingerprinting scripts.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[var(--hairline)] rounded-[2px]">
                      <thead className="bg-[var(--surface)] font-mono uppercase text-[10px] text-[var(--muted)]">
                        <tr>
                          <th className="p-3 border-b border-[var(--hairline)]">Cookie Identifier</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Category</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Lifespan</th>
                          <th className="p-3 border-b border-[var(--hairline)]">Technical Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--hairline)] text-[var(--muted)]">
                        <tr>
                          <td className="p-3 font-mono font-medium text-[var(--ink)]">sb-*-auth-token</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--accent)]">Strictly Necessary</td>
                          <td className="p-3">Session / Refresh (Max 1 year)</td>
                          <td className="p-3">Supabase authentication session bearer token (HttpOnly, Secure, SameSite=Lax).</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-medium text-[var(--ink)]">ibf_seen</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--accent)]">Strictly Necessary</td>
                          <td className="p-3">120 seconds (rolling)</td>
                          <td className="p-3">Presence heartbeat ensuring real-time team status and session freshness.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-medium text-[var(--ink)]">ibf_theme / prefs</td>
                          <td className="p-3 font-mono text-[11px] text-[var(--deep)]">Functional</td>
                          <td className="p-3">Persistent (1 year)</td>
                          <td className="p-3">Stores workspace layout preferences and user accessibility settings.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    <b>Managing Cookies:</b> You can disable or wipe cookies through your web browser settings. 
                    Please note that disabling strictly necessary authentication cookies will prevent you from signing in to the collaborative workspace.
                  </p>
                </div>
              </section>

              {/* Clause 14 */}
              <section id="minors-safety" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">14</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Protection of Minors &amp; Higher-Ed Governance
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("minors-safety")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "minors-safety" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    The Innovators platform is engineered for university students, adult software engineers, and venture-backed founders. 
                    Our age and educational governance policies require:
                  </p>

                  <ul className="list-disc pl-5 space-y-2 text-xs text-[var(--muted)]">
                    <li>
                      <b>Age Threshold:</b> Users must be at least 18 years of age (or the age of legal majority in their domestic jurisdiction) to establish an account.
                    </li>
                    <li>
                      <b>Strict COPPA Compliance:</b> We do not knowingly solicit, process, or collect personal information from children under the age of 13 
                      (or under 16 across the EEA and UK). If we discover that a minor under 13 has provided personal data, our security team will immediately terminate the account and execute cryptographic data erasure within 24 hours.
                    </li>
                    <li>
                      <b>Higher-Education Students:</b> University students participating in cohort collaborations do so under verified institutional credentials or adult builder attestations.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 15 */}
              <section id="security-toms" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">15</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Technical &amp; Organizational Security Measures (TOMs)
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("security-toms")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "security-toms" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    In accordance with <b>GDPR Article 32</b>, we maintain rigorous technical and organizational measures appropriate to the risk:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--ink)] flex items-center gap-2">
                        <Database size={14} className="text-[var(--accent)]" /> PostgreSQL Row-Level Security
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Data access controls are enforced at the database kernel level via Postgres RLS policies. Even in the event of application bugs, cross-tenant records cannot be selected.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--ink)] flex items-center gap-2">
                        <Lock size={14} className="text-[var(--accent)]" /> Cryptography in Transit &amp; Rest
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        All HTTP traffic is secured via TLS 1.3 with HSTS preloading. Primary relational volumes and file attachments are encrypted with AES-256 cipher suites.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--ink)] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[var(--accent)]" /> CSRF &amp; Origin Defense
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Cross-origin mutations are intercepted and rejected via <code>rejectCrossSiteMutation</code> using Sec-Fetch-Site and strict host header verification.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px]">
                      <h4 className="font-mono text-xs font-semibold text-[var(--ink)] flex items-center gap-2">
                        <Server size={14} className="text-[var(--accent)]" /> Principle of Least Privilege
                      </h4>
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        Administrative access to backend infrastructure requires multi-factor hardware security keys (FIDO2/WebAuthn) and ephemeral, audited session grants.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clause 16 */}
              <section id="breach-protocol" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">16</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Security Incident &amp; Breach Notification Protocol
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("breach-protocol")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "breach-protocol" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    In the improbable event of a personal data breach resulting from unauthorized access, loss, or security compromise, 
                    our incident response protocol requires:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--muted)]">
                    <li>
                      <b>72-Hour Supervisory Authority Notice:</b> Notifying relevant European Data Protection Authorities or international regulators within 72 hours of becoming aware of the breach, pursuant to GDPR Art. 33.
                    </li>
                    <li>
                      <b>User Notification Without Undue Delay:</b> Where a breach poses a high risk to user rights and freedoms, notifying affected users directly via registered email with mitigation guidance (GDPR Art. 34).
                    </li>
                    <li>
                      <b>Post-Mortem &amp; Remediation:</b> Publishing a transparent post-incident security audit detailing root cause, scope, and engineering mitigations taken.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 17 */}
              <section id="grievance-contacts" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">17</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Data Protection Officer &amp; Grievance Redressal
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("grievance-contacts")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "grievance-contacts" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-5 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    For inquiries, complaints, or statutory rights requests, contact our dedicated Data Protection and Legal Office:
                  </p>

                  <div className="p-5 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-[var(--accent)] uppercase font-semibold block">
                        Data Protection Officer (DPO)
                      </span>
                      <p className="font-medium text-[var(--ink)] mt-1">Innovator Bridge Foundry, Inc.</p>
                      <p className="text-[var(--muted)] mt-0.5">Attn: Privacy &amp; Data Governance</p>
                      <p className="mt-2 font-mono text-[var(--ink)]">
                        Email:{" "}
                        <a href="mailto:dpo@innovators-global.com" className="text-[var(--accent)] hover:underline">
                          dpo@innovators-global.com
                        </a>
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] text-[var(--deep)] uppercase font-semibold block">
                        Grievance Redressal Officer (India)
                      </span>
                      <p className="font-medium text-[var(--ink)] mt-1">Grievance Officer · DPDP Compliance</p>
                      <p className="text-[var(--muted)] mt-0.5">Statutory Redressal Desk</p>
                      <p className="mt-2 font-mono text-[var(--ink)]">
                        Email:{" "}
                        <a href="mailto:grievance@innovators-global.com" className="text-[var(--accent)] hover:underline">
                          grievance@innovators-global.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)]">
                    <b>Right to Lodge a Complaint:</b> If you believe our processing of your personal data infringes applicable data protection law, 
                    you possess the right to file a complaint with a supervisory authority, including the Data Protection Commission in your EU Member State, 
                    the UK Information Commissioner&rsquo;s Office (ICO), the California Privacy Protection Agency (CPPA), or the Data Protection Board of India.
                  </p>
                </div>
              </section>

              {/* Clause 18 */}
              <section id="revisions" className="scroll-mt-36">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">18</span>
                    <h2 className="font-display text-2xl text-[var(--ink)]">
                      Amendments, Version History &amp; Notifications
                    </h2>
                  </div>
                  <button
                    onClick={() => copySectionUrl("revisions")}
                    aria-label="Copy section link"
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition"
                  >
                    {copiedLink === "revisions" ? (
                      <span className="text-[10px] font-mono text-[var(--deep)]">Copied!</span>
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-[1.75] text-[var(--ink)]">
                  <p>
                    We reserve the right to amend this Policy to reflect evolving regulatory frameworks or architectural enhancements to our platform. 
                    When material changes occur:
                  </p>

                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--muted)]">
                    <li>
                      We will post an advance notification banner across the authenticated dashboard at least 14 days prior to effective adoption.
                    </li>
                    <li>
                      We will transmit a notice email to all registered account owners highlighting the updated terms.
                    </li>
                    <li>
                      The &ldquo;Last Revised&rdquo; timestamp at the top of this document will be updated.
                    </li>
                  </ul>

                  <div className="mt-4 p-4 bg-[var(--surface)] border border-[var(--hairline)] rounded-[2px] text-xs font-mono">
                    <span className="text-[var(--muted)] block">REVISION ARCHIVE</span>
                    <div className="mt-2 space-y-1 text-[var(--ink)]">
                      <div className="flex justify-between">
                        <span>• Version 2026.2 (Current)</span>
                        <span className="text-[var(--muted)]">Oct 21, 2026 · Comprehensive DPDP &amp; RLS disclosures</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Version 2026.1</span>
                        <span className="text-[var(--muted)]">Jan 15, 2026 · Initial Spring Cohort Release</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bottom Navigation Back to Top */}
              <div className="pt-8 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-mono text-[var(--muted)]">
                <a
                  href="#privacy-content"
                  className="hover:text-[var(--ink)] transition flex items-center gap-1.5"
                >
                  <ArrowRight size={13} className="-rotate-90 text-[var(--accent)]" />
                  <span>Return to Top</span>
                </a>
                <span>The Innovators · Privacy by Architecture</span>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Hallmark Ft1: Mast-Headed Colophon Footer */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--surface)] py-16 text-sm text-[var(--ink)] print:hidden">
        <div className="editorial-wrap">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--hairline)]">
            <div className="md:col-span-1">
              <Link href="/" className="font-display text-2xl font-medium tracking-tight">
                IBF
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Innovator Bridge Foundry builds sovereign collaboration infrastructure connecting venture founders with ambitious builders.
              </p>
              <p className="mt-4 font-mono text-[10px] text-[var(--deep)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--deep)] animate-pulse" aria-hidden="true" />
                Data Protection Officer on duty
              </p>
            </div>

            <div>
              <p className="font-mono-eyebrow">Platform</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <Link href="/projects" className="hover:text-[var(--ink)] transition">
                  Browse Projects
                </Link>
                <Link href="/dashboard" className="hover:text-[var(--ink)] transition">
                  Milestone Tracking
                </Link>
                <Link href="/projects/new" className="hover:text-[var(--ink)] transition">
                  Post a Brief
                </Link>
                <Link href="/help" className="hover:text-[var(--ink)] transition">
                  Knowledge Base
                </Link>
              </div>
            </div>

            <div>
              <p className="font-mono-eyebrow">Legal &amp; Compliance</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <Link href="/privacy" className="text-[var(--accent)] font-medium hover:underline">
                  Privacy Policy (Active)
                </Link>
                <Link href="/help" className="hover:text-[var(--ink)] transition">
                  Terms of Service
                </Link>
                <a href="/api/account" className="hover:text-[var(--ink)] transition">
                  Export Personal Data (JSON)
                </a>
                <Link href="/settings" className="hover:text-[var(--ink)] transition">
                  Account Erasure Controls
                </Link>
              </div>
            </div>

            <div>
              <p className="font-mono-eyebrow">Direct Contact</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-[var(--muted)]">
                <a href="mailto:privacy@innovators-global.com" className="hover:text-[var(--ink)] transition">
                  privacy@innovators-global.com
                </a>
                <a href="mailto:dpo@innovators-global.com" className="hover:text-[var(--ink)] transition">
                  dpo@innovators-global.com
                </a>
                <span className="text-xs font-mono text-[var(--muted)] mt-2">
                  Response SLA: &le; 30 Calendar Days
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[var(--muted)]">
            <p>© 2026 Innovator Bridge Foundry, Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-[var(--accent)] font-semibold">
                Privacy Policy
              </Link>
              <Link href="/help" className="hover:text-[var(--ink)] transition">
                Terms of Service
              </Link>
              <Link href="/help" className="hover:text-[var(--ink)] transition">
                Security Architecture
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
