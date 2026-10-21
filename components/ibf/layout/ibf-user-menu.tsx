"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  UserPlus,
  Moon,
  LogOut,
  ChevronsUpDown,
  Check,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export interface IbfUserMenuProps {
  userProfile?: {
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  } | null;
  isCollapsed?: boolean;
}

export function IbfUserMenu({ userProfile, isCollapsed = false }: IbfUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const name = userProfile?.name || "Jatin Patel";
  const email = userProfile?.email || "jatin@innovators-global.com";
  const role = userProfile?.role ? String(userProfile.role).replace("_", " ") : "Founder";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
      toast.success("Logged out successfully");
      router.push("/auth/signin");
    } catch {
      router.push("/auth/signin");
    }
  }

  function handleCopyInvite() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + "/auth/signup");
      toast.success("Workspace invite link copied to clipboard!");
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Footer Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] group ${
          isOpen ? "bg-white/[0.06] border-white/[0.08]" : ""
        } ${isCollapsed ? "justify-center px-1" : ""}`}
        title={`${name} (${role})`}
      >
        {/* Avatar with Green Online Dot */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-cyan-300/10 border border-cyan-300/30 text-cyan-300 flex items-center justify-center font-bold text-xs shadow-inner">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {/* Pulsing Green Online Indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#0d121f]" />
          </span>
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition">
              {name}
            </p>
            <p className="text-[10px] text-slate-400 capitalize truncate font-mono">
              {role.toLowerCase()}
            </p>
          </div>
        )}

        {!isCollapsed && (
          <ChevronsUpDown
            size={14}
            className="text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition"
          />
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#0d1424] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Header */}
          <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
            <p className="text-xs font-bold text-white truncate">{name}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{email}</p>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              <Settings size={14} className="text-slate-400" />
              Account Settings
            </Link>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition text-left"
            >
              <UserPlus size={14} className="text-slate-400" />
              Invite Team Members
            </button>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2.5">
                <Moon size={14} className="text-slate-400" />
                Theme
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-300/10 px-2 py-0.5 rounded-full border border-cyan-300/20">
                Dark Precision
              </span>
            </div>
          </div>

          <div className="mt-1 pt-1 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
