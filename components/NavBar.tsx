"use client";
import Link from "next/link";
import { Bell, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
export default function NavBar({ dashboard = false }: { dashboard?: boolean }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    if (dashboard)
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then(setProfile);
  }, [dashboard]);
  const name = profile?.name || "IBF Member",
    role = profile?.role ? String(profile.role).replace("_", " ") : "Member",
    initials = name
      .split(" ")
      .map((x: string) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <>
      <header
        className={`h-16 flex items-center px-5 lg:px-8 border-b z-50 ${dashboard ? "bg-[#0d1422] border-white/[.07]" : "bg-[#0a0f1e]/80 backdrop-blur-xl border-white/[.07] sticky top-0"}`}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-lg bg-cyan-300 grid place-items-center text-slate-950 shadow-[0_0_25px_rgba(0,245,212,.15)] transition group-hover:rotate-6">
            <Sparkles size={18} />
          </span>
          <span className="font-black text-xl tracking-tight text-white">
            IBF
          </span>
          {!dashboard && (
            <span className="hidden sm:block ml-1 px-2 py-1 rounded-full border border-cyan-300/15 text-[8px] tracking-[.16em] text-cyan-300">
              BETA
            </span>
          )}
        </Link>
        {!dashboard && (
          <nav className="hidden md:flex gap-8 ml-12 text-xs font-semibold text-slate-400">
            <Link className="hover:text-cyan-300 transition" href="/projects">
              Explore Projects
            </Link>
            <Link className="hover:text-cyan-300 transition" href="/matches">
              Find Talent
            </Link>
            <Link className="hover:text-cyan-300 transition" href="/investors">
              For Investors
            </Link>
            <a className="hover:text-cyan-300 transition" href="/#how">
              How It Works
            </a>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          {dashboard ? (
            <>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative p-2 text-slate-400 hover:text-cyan-300"
              >
                <Bell size={20} />
                <i className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-300 border-2 border-[#0d1422]" />
              </Link>
              <div className="h-7 w-px bg-white/10" />
              <Link href="/settings" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-cyan-300/10 border border-cyan-300/20 text-cyan-300 grid place-items-center font-bold text-sm">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold leading-none text-white group-hover:text-cyan-300">
                    {name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {role.toLowerCase()}
                  </p>
                </div>
                <ChevronDown size={15} className="text-slate-500" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hidden sm:block text-xs font-bold px-3 text-slate-300 hover:text-cyan-300"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="cyber-btn cyber-btn-primary !min-w-0 !py-2.5 !px-4"
              >
                Join IBF <span className="hidden sm:inline">Free</span>
              </Link>
              <button
                aria-label="Toggle menu"
                className="md:hidden text-slate-300"
                onClick={() => setOpen(!open)}
              >
                {open ? <X /> : <Menu />}
              </button>
            </>
          )}
        </div>
      </header>
      {open && !dashboard && (
        <div className="fixed inset-x-0 top-16 z-40 md:hidden border-b border-white/10 bg-[#0d1322]/95 backdrop-blur-xl p-5 grid gap-2 shadow-2xl">
          <Link
            onClick={() => setOpen(false)}
            className="p-3 rounded-lg hover:bg-white/5"
            href="/projects"
          >
            Explore Projects
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className="p-3 rounded-lg hover:bg-white/5"
            href="/matches"
          >
            Find Talent
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className="p-3 rounded-lg hover:bg-white/5"
            href="/investors"
          >
            For Investors
          </Link>
          <a
            onClick={() => setOpen(false)}
            className="p-3 rounded-lg hover:bg-white/5"
            href="/#how"
          >
            How It Works
          </a>
        </div>
      )}
    </>
  );
}
