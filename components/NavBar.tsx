"use client";
import Link from "next/link";
import { Bell, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
export default function NavBar({ dashboard = false }: { dashboard?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header
        className={`h-16 flex items-center px-5 lg:px-8 border-b z-50 ${dashboard ? "bg-[#08101c] border-white/[.07]" : "bg-[#060a12]/80 backdrop-blur-xl border-white/[.07] sticky top-0"}`}
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
              <button className="relative p-2 text-slate-400 hover:text-cyan-300">
                <Bell size={20} />
                <i className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-300 border-2 border-[#08101c]" />
              </button>
              <div className="h-7 w-px bg-white/10" />
              <div className="w-9 h-9 rounded-full bg-cyan-300/10 border border-cyan-300/20 text-cyan-300 grid place-items-center font-bold text-sm">
                AR
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-none text-white">
                  Alex Rivera
                </p>
                <p className="text-xs text-slate-500 mt-1">Student</p>
              </div>
              <ChevronDown size={15} className="text-slate-500" />
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
        <div className="fixed inset-x-0 top-16 z-40 md:hidden border-b border-white/10 bg-[#080e18]/95 backdrop-blur-xl p-5 grid gap-2 shadow-2xl">
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
