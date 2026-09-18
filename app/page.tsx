'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Project = {
  id: string;
  title: string;
  description: string;
  domain?: string | null;
  stage?: string | null;
};

const steps = [
  {
    number: '01',
    title: 'Create your profile',
    description:
      'Set out what you can do, what you need, and how much time you can commit. A focused profile takes minutes to complete.',
  },
  {
    number: '02',
    title: 'Get matched',
    description:
      'Find people and projects aligned with your skills, interests, availability, and preferred way of working.',
  },
  {
    number: '03',
    title: 'Build together',
    description:
      'Move into a shared workspace. Plan milestones, exchange files, schedule meetings, and record the work you finish.',
  },
];

const founderPoints = [
  'Post a clear project brief in 3 minutes.',
  'Review people by skills, availability, and project fit.',
  'Manage milestones, meetings, and team conversations in one place.',
];

const studentPoints = [
  'Join open projects that match your interests.',
  'Work directly with founders on defined outcomes.',
  'Turn completed milestones into reviews and verifiable credentials.',
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let active = true;

    fetch('/api/projects')
      .then(async (response) => {
        if (!response.ok) return { projects: [] };
        return response.json();
      })
      .then((body) => {
        if (active && Array.isArray(body.projects)) {
          setProjects(body.projects.slice(0, 3));
        }
      })
      .catch(() => {
        if (active) setProjects([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--base)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-[var(--base)]">
        <div className="editorial-wrap flex min-h-16 items-center gap-8">
          <Link
            href="/"
            className="font-display text-[28px] font-medium leading-none"
          >
            IBF
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 md:flex"
          >
            <Link className="font-mono-eyebrow" href="/projects">
              Projects
            </Link>
            <Link className="font-mono-eyebrow" href="/investors">
              Investors
            </Link>
            <Link className="font-mono-eyebrow" href="/help">
              Help
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="px-2 py-3 text-sm font-medium sm:px-4"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-editorial text-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="editorial-section">
          <div className="editorial-wrap">
            <p className="font-mono-eyebrow">
              IBF — Innovator Bridge Foundry
            </p>
            <h1 className="editorial-title mt-7 max-w-[1060px] text-[48px] md:text-[72px]">
              Where founders meet the people who&apos;ll build it with them.
            </h1>
            <p className="mt-8 max-w-[560px] text-[18px] leading-[1.7] text-[var(--muted)]">
              IBF connects early-stage founders with students and young
              professionals through structured project matching, verifiable
              credentials, and real collaboration tools.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/projects/new" className="btn-editorial">
                Post a project
              </Link>
              <Link href="/projects" className="btn-ghost">
                Browse projects →
              </Link>
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-wrap grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="font-mono-eyebrow">01 — The problem</p>
              <h2 className="editorial-title mt-5 text-[32px] leading-[1.15]">
                Founders can&apos;t find the right people. Students can&apos;t find
                real work.
              </h2>
            </div>
            <div className="space-y-6 md:col-span-7 md:pt-8">
              <p className="editorial-copy">
                Early-stage founders often recruit through scattered messages,
                broad job boards, and introductions without enough context. It
                takes too long to find someone with the right skills, time, and
                interest in the problem.
              </p>
              <p className="editorial-copy">
                Students and young professionals face the other side of the same
                gap. They need work with real decisions and real outcomes, not
                another simulated brief. IBF gives both sides a defined place to
                meet and build.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="editorial-section bg-[var(--surface)]">
          <div className="editorial-wrap">
            <p className="font-mono-eyebrow">02 — How it works</p>
            <h2 className="editorial-title mt-5 text-[40px]">
              Three steps. No noise.
            </h2>

            <div className="mt-14 border-t border-[var(--hairline)]">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-5 border-b border-[var(--hairline)] py-9 md:grid-cols-[120px_260px_1fr] md:items-start md:gap-10"
                >
                  <span className="font-display text-[48px] font-medium leading-none text-[var(--muted)]">
                    {step.number}
                  </span>
                  <h3 className="font-display text-[22px] font-medium leading-[1.2]">
                    {step.title}
                  </h3>
                  <p className="editorial-copy max-w-[590px]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="editorial-wrap">
            <p className="font-mono-eyebrow">03 — The workspace</p>
            <h2 className="editorial-title mt-5 text-[40px]">
              Built for the work that matters.
            </h2>
            <div className="mt-12 flex min-h-[420px] items-center justify-center border border-[var(--hairline)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              Product workspace screenshot coming after the next verified release.
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--hairline)]">
          <div className="editorial-wrap grid md:grid-cols-2">
            <article className="py-20 md:py-24 md:pr-14">
              <p className="font-mono-eyebrow">For founders</p>
              <h2 className="editorial-title mt-5 max-w-[430px] text-[32px] leading-[1.15]">
                Ship faster with the right team.
              </h2>
              <ul className="mt-9 space-y-4 text-[15px] leading-[1.65] text-[var(--muted)]">
                {founderPoints.map((point) => (
                  <li
                    key={point}
                    className="border-t border-[var(--hairline)] pt-4"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </article>

            <article className="border-t border-[var(--hairline)] py-20 md:border-l md:border-t-0 md:py-24 md:pl-14">
              <p className="font-mono-eyebrow">For students</p>
              <h2 className="editorial-title mt-5 max-w-[430px] text-[32px] leading-[1.15]">
                Work on things worth building.
              </h2>
              <ul className="mt-9 space-y-4 text-[15px] leading-[1.65] text-[var(--muted)]">
                {studentPoints.map((point) => (
                  <li
                    key={point}
                    className="border-t border-[var(--hairline)] pt-4"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {projects.length > 0 && (
          <section className="editorial-section">
            <div className="editorial-wrap">
              <p className="font-mono-eyebrow">04 — Open projects</p>
              <h2 className="editorial-title mt-5 text-[40px]">
                What&apos;s being built right now.
              </h2>

              <div className="mt-12 border-t border-[var(--hairline)]">
                {projects.map((project) => (
                  <Link
                    href={`/projects/${project.id}`}
                    key={project.id}
                    className="grid gap-4 border-b border-[var(--hairline)] py-8 md:grid-cols-[1fr_180px] md:gap-10"
                  >
                    <div>
                      <h3 className="font-display text-[22px] font-medium">
                        {project.title}
                      </h3>
                      <p className="mt-3 max-w-[720px] text-[15px] leading-[1.7] text-[var(--muted)]">
                        {project.description}
                      </p>
                    </div>
                    <p className="font-mono-eyebrow md:text-right">
                      {[project.domain, project.stage]
                        .filter(Boolean)
                        .join(' · ') || 'Open project'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="editorial-section bg-[var(--surface)] text-center">
          <div className="editorial-wrap flex flex-col items-center">
            <h2 className="editorial-title text-[48px] md:text-[56px]">
              Start building.
            </h2>
            <p className="mt-6 max-w-[480px] text-[16px] leading-[1.7] text-[var(--muted)]">
              Create a profile, describe what you want to build, and meet people
              ready to do the work with you.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="btn-editorial">
                Create an account
              </Link>
              <Link href="#how" className="btn-ghost">
                See how it works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hairline)] bg-[var(--base)]">
        <div className="editorial-wrap grid gap-12 py-14 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-display text-[28px] font-medium">
              IBF
            </Link>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Innovator Bridge Foundry
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-mono-eyebrow">Platform</p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                <Link href="/projects">Projects</Link>
                <Link href="/marketplace">Marketplace</Link>
                <Link href="/events">Events</Link>
              </div>
            </div>
            <div>
              <p className="font-mono-eyebrow">Company</p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                <Link href="/investors">Investors</Link>
                <Link href="/help">Help</Link>
                <a href="mailto:hello@innovators-global.com">Contact</a>
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--muted)] md:text-right">
            © 2026 IBF — innovators-global.com
          </p>
        </div>
      </footer>
    </div>
  );
}
