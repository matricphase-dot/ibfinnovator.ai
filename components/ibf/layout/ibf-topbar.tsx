"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Menu,
  ChevronRight,
  Kanban,
  List,
  RotateCw,
  Layers,
  FileText,
  Settings,
  Command,
} from "lucide-react";

export type IbfViewType = "board" | "list" | "cycles" | "modules" | "pages" | "settings" | "analytics";

export interface IbfTopbarProps {
  workspaceName: string;
  projectName?: string;
  projectIdentifier?: string;
  projectId?: string;
  activeView?: IbfViewType;
  onViewChange?: (view: "board" | "list" | "cycles" | "modules" | "pages" | "settings") => void;
  onOpenCommandPalette: () => void;
  onOpenCreateIssue: () => void;
  onToggleMobileSidebar?: () => void;
  counts?: {
    issues?: number;
    cycles?: number;
    modules?: number;
    pages?: number;
  };
  breadcrumbs?: Array<{ label: string; href?: string }>;
  showTabs?: boolean;
}

export function IbfTopbar({
  workspaceName,
  projectName,
  projectIdentifier,
  projectId,
  activeView = "board",
  onViewChange,
  onOpenCommandPalette,
  onOpenCreateIssue,
  onToggleMobileSidebar,
  counts,
  breadcrumbs,
  showTabs = true,
}: IbfTopbarProps) {
  const router = useRouter();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  function handleTabClick(view: "board" | "list" | "cycles" | "modules" | "pages" | "settings") {
    if (onViewChange) {
      onViewChange(view);
    } else if (projectId) {
      router.push(`/projects/${projectId}/${view}`);
    }
  }

  // Format view title for breadcrumb
  const viewTitle =
    activeView === "board"
      ? "Board"
      : activeView === "list"
      ? "List"
      : activeView === "cycles"
      ? "Cycles"
      : activeView === "modules"
      ? "Modules"
      : activeView === "pages"
      ? "Pages"
      : activeView === "analytics"
      ? "Analytics"
      : activeView === "settings"
      ? "Settings"
      : "Issues";

  const tabs = [
    {
      id: "board" as const,
      label: "Board",
      icon: Kanban,
    },
    {
      id: "list" as const,
      label: "List",
      icon: List,
    },
    {
      id: "cycles" as const,
      label: "Cycles",
      icon: RotateCw,
      badge: counts?.cycles !== undefined && counts.cycles > 0 ? String(counts.cycles) : undefined,
    },
    {
      id: "modules" as const,
      label: "Modules",
      icon: Layers,
      badge: counts?.modules !== undefined && counts.modules > 0 ? String(counts.modules) : undefined,
    },
    {
      id: "pages" as const,
      label: "Pages",
      icon: FileText,
      badge: counts?.pages !== undefined && counts.pages > 0 ? String(counts.pages) : undefined,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 select-none flex-shrink-0 shadow-xs">
      {/* 1. TOP BAR: Hamburger + Breadcrumbs + Search Trigger + New Issue */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Dynamic Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
            {breadcrumbs ? (
              breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-slate-600 hover:text-slate-900 truncate transition"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-bold truncate">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-slate-900 truncate transition"
                >
                  {workspaceName || "Workspace"}
                </Link>

                {projectName && (
                  <>
                    <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                    <Link
                      href={projectId ? `/projects/${projectId}/board` : "/dashboard"}
                      className="text-slate-700 hover:text-slate-900 truncate flex items-center gap-1.5 transition font-semibold"
                    >
                      <span className="truncate">{projectName}</span>
                      {projectIdentifier && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {projectIdentifier}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {activeView && (
                  <>
                    <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-900 font-bold truncate">{viewTitle}</span>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Center: Universal Search Mockup (Cmd+K / Ctrl+K) */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-sm">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-600 transition group"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400 group-hover:text-cyan-700 transition" />
              <span className="text-slate-500 group-hover:text-slate-700">
                Search or jump to...
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 group-hover:text-slate-700 transition shadow-xs">
              <span>{isMac ? "⌘" : "Ctrl"}</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Quick Search Mobile Icon + New Issue Action */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            title="Search (Cmd+K)"
          >
            <Search size={16} />
          </button>

          {/* Primary Quick Action (+ New Issue) with C key badge */}
          <button
            type="button"
            onClick={onOpenCreateIssue}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95"
            title="Create New Issue (Press C)"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Issue</span>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-cyan-700/60 px-1 rounded font-semibold text-white">
              C
            </kbd>
          </button>
        </div>
      </div>

      {/* 2. PROJECT VIEW TABS (Board, List, Cycles, Modules, Pages, Settings) */}
      {showTabs && projectName && (
        <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-cyan-600 text-cyan-700 font-bold bg-cyan-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} className={isActive ? "text-cyan-600" : "opacity-75"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-cyan-100 text-cyan-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
