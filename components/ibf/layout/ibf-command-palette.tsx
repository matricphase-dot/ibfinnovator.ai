"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Home,
  Flag,
  Bell,
  Settings,
  FolderKanban,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  X,
  Command,
} from "lucide-react";
import { IbfProject } from "./workspace-context";

export interface IbfCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: IbfProject[];
  onOpenCreateIssue?: () => void;
  onOpenCreateProject?: () => void;
}

export function IbfCommandPalette({
  isOpen,
  onClose,
  projects = [],
  onOpenCreateIssue,
  onOpenCreateProject,
}: IbfCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIssues, setSearchIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setSearchIssues([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search for issues
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchIssues([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingIssues(true);
      try {
        const res = await fetch(`/api/issues?q=${encodeURIComponent(query.trim())}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSearchIssues(data.issues || []);
        }
      } catch (err) {
        console.error("Failed to search issues:", err);
      } finally {
        setLoadingIssues(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigation Items
  const staticActions = [
    {
      id: "action-new-issue",
      category: "Actions",
      title: "Create New Issue",
      subtitle: "Shortcut: Press C anywhere",
      icon: Plus,
      onSelect: () => {
        onClose();
        onOpenCreateIssue?.();
      },
    },
    {
      id: "action-new-project",
      category: "Actions",
      title: "Create New Project",
      subtitle: "Start a new venture or repository",
      icon: FolderKanban,
      onSelect: () => {
        onClose();
        onOpenCreateProject?.();
      },
    },
    {
      id: "nav-home",
      category: "Navigation",
      title: "Home / Overview",
      subtitle: "Venture analytics and summary metrics",
      icon: Home,
      onSelect: () => {
        onClose();
        router.push("/dashboard");
      },
    },
    {
      id: "nav-your-issues",
      category: "Navigation",
      title: "Your Issues",
      subtitle: "Issues assigned to you across projects",
      icon: Flag,
      onSelect: () => {
        onClose();
        router.push("/your-issues");
      },
    },
    {
      id: "nav-notifications",
      category: "Navigation",
      title: "Notifications",
      subtitle: "Unread alerts, mentions, and updates",
      icon: Bell,
      onSelect: () => {
        onClose();
        router.push("/notifications");
      },
    },
    {
      id: "nav-settings",
      category: "Navigation",
      title: "Account Settings",
      subtitle: "Profile, preferences, and security",
      icon: Settings,
      onSelect: () => {
        onClose();
        router.push("/settings");
      },
    },
  ];

  // Projects as search items
  const projectItems = projects.map((p) => ({
    id: `project-${p.id}`,
    category: "Projects",
    title: p.name,
    subtitle: `${p.identifier} · ${p.issue_count} issues · ${p.active_cycle_count} active sprints`,
    icon: FolderKanban,
    onSelect: () => {
      onClose();
      router.push(`/projects/${p.id}/board`);
    },
  }));

  // Issues items
  const issueItems = searchIssues.map((issue) => {
    const ident = issue.project?.identifier
      ? `${issue.project.identifier}-${issue.sequence_id}`
      : `#${issue.sequence_id || ""}`;

    return {
      id: `issue-${issue.id}`,
      category: "Issues",
      title: issue.title,
      subtitle: `${ident} · ${issue.state} · ${issue.priority || "no priority"}`,
      icon: issue.state === "done" ? CheckCircle2 : issue.state === "in_progress" ? Clock : Circle,
      onSelect: () => {
        onClose();
        if (issue.project_id) {
          router.push(`/projects/${issue.project_id}/board`);
        }
      },
    };
  });

  // Filter items based on query
  const qLower = query.toLowerCase();
  const filteredActions = staticActions.filter(
    (item) =>
      item.title.toLowerCase().includes(qLower) ||
      item.subtitle.toLowerCase().includes(qLower)
  );

  const filteredProjects = projectItems.filter(
    (item) =>
      item.title.toLowerCase().includes(qLower) ||
      item.subtitle.toLowerCase().includes(qLower)
  );

  const allItems = [...filteredActions, ...filteredProjects, ...issueItems];

  // Handle keyboard arrows and Enter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].onSelect();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0d1424] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#0a0f1d]">
          <Search size={18} className="text-cyan-300 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search issues, projects, pages..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-white p-1 rounded"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline font-mono text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 font-semibold">No results found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with a different term or keyword
              </p>
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
                      : "text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? "bg-cyan-400/20 border-cyan-400/30 text-cyan-300"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : ""}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-white/5">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} className="text-cyan-300" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-[#090d18] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400/80">IBF Plane Engine</span>
        </div>
      </div>
    </div>
  );
}
