"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flag,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { IbfWorkspaceSwitcher } from "./ibf-workspace-switcher";
import { IbfProjectTree } from "./ibf-project-tree";
import { IbfUserMenu } from "./ibf-user-menu";

export interface IbfSidebarProps {
  currentWorkspace: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  projects: Array<{
    id: string;
    name: string;
    identifier: string;
    emoji?: string;
    issue_count: number;
    active_cycle_count: number;
    module_count?: number;
    page_count?: number;
  }>;
  activeProjectId?: string;
  activeSection?: "issues" | "cycles" | "modules" | "pages" | "analytics" | "settings" | "board" | "list";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  }>;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  onCreateProject?: () => void;
  onOpenQuickIssue?: (projectId: string) => void;
  userProfile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  } | null;
}

export function IbfSidebar({
  currentWorkspace,
  projects,
  activeProjectId,
  activeSection,
  isCollapsed,
  onToggleCollapse,
  workspaces = [],
  onSelectWorkspace,
  onCreateWorkspace,
  onCreateProject,
  onOpenQuickIssue,
  userProfile,
}: IbfSidebarProps) {
  const pathname = usePathname();

  const globalViews = [
    {
      id: "home",
      label: "Home / Overview",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      id: "your-issues",
      label: "Your Issues",
      href: "/your-issues",
      icon: Flag,
      isActive: pathname === "/your-issues",
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      isActive: pathname === "/notifications",
    },
  ];

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 z-40 select-none flex-shrink-0 ${
        isCollapsed ? "w-16" : "w-[260px]"
      }`}
    >
      {/* 1. TOP SECTION: Workspace Header + Global Views + Project Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col p-3">
        {/* Workspace Switcher Header & Collapse Button */}
        <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-slate-200">
          <div className="flex-1 min-w-0">
            <IbfWorkspaceSwitcher
              currentWorkspace={currentWorkspace}
              workspaces={workspaces}
              onSelectWorkspace={onSelectWorkspace}
              onCreateWorkspace={onCreateWorkspace}
              isCollapsed={isCollapsed}
            />
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* 2. GLOBAL VIEWS */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-2 pt-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Global Views
            </p>
          )}

          {globalViews.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                  item.isActive
                    ? "bg-cyan-50 text-cyan-700 font-bold border border-cyan-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                } ${isCollapsed ? "justify-center px-1" : ""}`}
                title={item.label}
              >
                <Icon size={16} className={item.isActive ? "text-cyan-600" : "opacity-80"} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* 3. PROJECTS TREE */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex-1">
          <IbfProjectTree
            projects={projects}
            activeProjectId={activeProjectId}
            activeSection={activeSection}
            onOpenQuickIssue={onOpenQuickIssue}
            onCreateProject={onCreateProject}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>

      {/* 4. BOTTOM PINNED FOOTER: User Profile Menu */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <IbfUserMenu userProfile={userProfile} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
