"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Plus,
  Kanban,
  RotateCw,
  Layers,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";

export interface IbfProjectTreeProps {
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
  activeSection?: string;
  onOpenQuickIssue?: (projectId: string) => void;
  onCreateProject?: () => void;
  isCollapsed?: boolean;
}

export function IbfProjectTree({
  projects,
  activeProjectId,
  activeSection,
  onOpenQuickIssue,
  onCreateProject,
  isCollapsed = false,
}: IbfProjectTreeProps) {
  const pathname = usePathname();

  // Track expanded state for projects
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeProjectId) {
      initial[activeProjectId] = true;
    } else if (projects.length > 0) {
      initial[projects[0].id] = true;
    }
    return initial;
  });

  function toggleProject(projectId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }

  if (isCollapsed) {
    // Collapsed Rail: Show project monograms
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        {projects.map((project) => {
          const isCurrent = project.id === activeProjectId;
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition border ${
                isCurrent
                  ? "bg-cyan-400/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(0,245,212,0.15)]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
              title={`${project.name} (${project.identifier})`}
            >
              {project.identifier.slice(0, 2)}
            </Link>
          );
        })}
        {onCreateProject && (
          <button
            type="button"
            onClick={onCreateProject}
            className="w-9 h-9 rounded-xl border border-dashed border-white/20 text-slate-500 hover:text-cyan-300 hover:border-cyan-300/40 flex items-center justify-center transition"
            title="Create New Project"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 pt-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
        <span>Projects</span>
        <button
          type="button"
          onClick={onCreateProject}
          className="text-slate-500 hover:text-cyan-300 transition p-0.5 rounded hover:bg-white/5"
          title="Create New Project"
        >
          <Plus size={14} />
        </button>
      </div>

      {projects.length === 0 && (
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-slate-400">No projects yet</p>
          <button
            type="button"
            onClick={onCreateProject}
            className="mt-2 text-xs font-semibold text-cyan-300 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <Plus size={12} /> Create First Project
          </button>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-1">
        {projects.map((project) => {
          const isExpanded = !!expandedProjects[project.id];
          const isCurrentProject = project.id === activeProjectId;

          const childItems = [
            {
              id: "issues",
              label: "Issues",
              href: `/projects/${project.id}/board`,
              icon: Kanban,
              badge: project.issue_count > 0 ? String(project.issue_count) : null,
              isActive:
                isCurrentProject &&
                (activeSection === "board" ||
                  activeSection === "list" ||
                  activeSection === "issues" ||
                  pathname?.includes(`/projects/${project.id}/board`) ||
                  pathname?.includes(`/projects/${project.id}/list`)),
            },
            {
              id: "cycles",
              label: "Cycles",
              href: `/projects/${project.id}/cycles`,
              icon: RotateCw,
              badge:
                project.active_cycle_count > 0
                  ? `${project.active_cycle_count} active`
                  : null,
              badgeHighlight: project.active_cycle_count > 0,
              isActive:
                isCurrentProject &&
                (activeSection === "cycles" ||
                  pathname?.includes(`/projects/${project.id}/cycles`)),
            },
            {
              id: "modules",
              label: "Modules",
              href: `/projects/${project.id}/modules`,
              icon: Layers,
              badge:
                (project.module_count ?? 0) > 0
                  ? String(project.module_count)
                  : null,
              isActive:
                isCurrentProject &&
                (activeSection === "modules" ||
                  pathname?.includes(`/projects/${project.id}/modules`)),
            },
            {
              id: "pages",
              label: "Pages",
              href: `/projects/${project.id}/pages`,
              icon: FileText,
              badge:
                (project.page_count ?? 0) > 0
                  ? String(project.page_count)
                  : null,
              isActive:
                isCurrentProject &&
                (activeSection === "pages" ||
                  pathname?.includes(`/projects/${project.id}/pages`)),
            },
            {
              id: "analytics",
              label: "Analytics",
              href: `/projects/${project.id}/analytics`,
              icon: BarChart3,
              isActive:
                isCurrentProject &&
                (activeSection === "analytics" ||
                  pathname?.includes(`/projects/${project.id}/analytics`)),
            },
            {
              id: "settings",
              label: "Settings",
              href: `/projects/${project.id}/settings`,
              icon: Settings,
              isActive:
                isCurrentProject &&
                (activeSection === "settings" ||
                  pathname?.includes(`/projects/${project.id}/settings`)),
            },
          ];

          return (
            <div key={project.id} className="space-y-0.5">
              {/* Project Main Header Row */}
              <div
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCurrentProject
                    ? "bg-white/[0.05] text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0"
                  onClick={(e) => toggleProject(project.id, e)}
                >
                  {/* Caret */}
                  <ChevronRight
                    size={14}
                    className={`text-slate-500 transition-transform duration-150 flex-shrink-0 ${
                      isExpanded ? "rotate-90 text-cyan-300" : ""
                    }`}
                  />

                  {/* Project Monogram / Identifier */}
                  <span className="w-5 h-5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-mono text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {project.emoji || project.identifier.slice(0, 3)}
                  </span>

                  {/* Project Name */}
                  <span className="truncate tracking-tight">{project.name}</span>
                </div>

                {/* Quick Add Issue Button on Project Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenQuickIssue?.(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded transition"
                  title={`Create issue in ${project.name}`}
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Sub-Tree (Children) */}
              {isExpanded && (
                <div className="ml-4 pl-3 border-l border-white/[0.06] space-y-0.5 py-0.5">
                  {childItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          item.isActive
                            ? "bg-cyan-400/10 text-cyan-300 font-bold border border-cyan-400/20 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={14} className="flex-shrink-0 opacity-80" />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full leading-tight font-semibold ${
                              item.badgeHighlight
                                ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                                : "bg-white/5 text-slate-400 border border-white/5"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Direct Create Project Button */}
      {onCreateProject && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onCreateProject}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-cyan-300 border border-dashed border-white/[0.08] hover:border-cyan-300/30 hover:bg-cyan-400/[0.03] transition"
          >
            <Plus size={13} />
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
}
