"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  FileText,
  RotateCw,
  Layers,
  Sparkles,
  Loader2,
  Kanban,
  List,
} from "lucide-react";
import { IbfProject } from "./layout/workspace-context";

export interface IbfCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: IbfProject[];
  activeProjectId?: string;
  onOpenCreateIssue?: () => void;
  onOpenCreateProject?: () => void;
  onOpenCreateDocument?: () => void;
}

interface PaletteItem {
  id: string;
  category: "Navigation" | "Quick Actions" | "Projects" | "Issues" | "Cycles" | "Modules" | "Pages";
  title: string;
  subtitle?: string;
  icon: any;
  hotkey?: string;
  onSelect: () => void;
}

export function IbfCommandPalette({
  isOpen,
  onClose,
  projects = [],
  activeProjectId,
  onOpenCreateIssue,
  onOpenCreateProject,
  onOpenCreateDocument,
}: IbfCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search results state from /api/workspace/search
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    issues: any[];
    projects: any[];
    cycles: any[];
    modules: any[];
    pages: any[];
  }>({
    issues: [],
    projects: [],
    cycles: [],
    modules: [],
    pages: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  const currentProjId = currentProject?.id || "";

  // Reset and focus when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setSearchResults({ issues: [], projects: [], cycles: [], modules: [], pages: [] });
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Debounced search via global /api/workspace/search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 1) {
      setSearchResults({ issues: [], projects: [], cycles: [], modules: [], pages: [] });
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspace/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            issues: data.issues || [],
            projects: data.projects || [],
            cycles: data.cycles || [],
            modules: data.modules || [],
            pages: data.pages || [],
          });
        }
      } catch (err) {
        console.error("Command palette search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Static Navigation Items
  const staticNavigationItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    if (currentProjId) {
      items.push(
        {
          id: "nav-kanban",
          category: "Navigation",
          title: "Go to Kanban Board",
          subtitle: `${currentProject?.name || "Project"} board view`,
          icon: Kanban,
          hotkey: "Jump to",
          onSelect: () => {
            onClose();
            router.push(`/projects/${currentProjId}/board`);
          },
        },
        {
          id: "nav-list",
          category: "Navigation",
          title: "Go to List View",
          subtitle: `${currentProject?.name || "Project"} linear backlog`,
          icon: List,
          hotkey: "Jump to",
          onSelect: () => {
            onClose();
            router.push(`/projects/${currentProjId}/list`);
          },
        },
        {
          id: "nav-cycles",
          category: "Navigation",
          title: "Go to Active Cycles",
          subtitle: `${currentProject?.name || "Project"} sprint cycles`,
          icon: RotateCw,
          hotkey: "Jump to",
          onSelect: () => {
            onClose();
            router.push(`/projects/${currentProjId}/cycles`);
          },
        },
        {
          id: "nav-modules",
          category: "Navigation",
          title: "Go to Feature Modules",
          subtitle: `${currentProject?.name || "Project"} feature roadmap`,
          icon: Layers,
          hotkey: "Jump to",
          onSelect: () => {
            onClose();
            router.push(`/projects/${currentProjId}/modules`);
          },
        },
        {
          id: "nav-pages",
          category: "Navigation",
          title: "Go to Documentation Pages",
          subtitle: `${currentProject?.name || "Project"} technical PRDs and docs`,
          icon: FileText,
          hotkey: "Jump to",
          onSelect: () => {
            onClose();
            router.push(`/projects/${currentProjId}/pages`);
          },
        }
      );
    }

    items.push(
      {
        id: "nav-home",
        category: "Navigation",
        title: "Go to Dashboard",
        subtitle: "Workspace overview and ventures",
        icon: Home,
        hotkey: "Jump to",
        onSelect: () => {
          onClose();
          router.push("/dashboard");
        },
      },
      {
        id: "nav-your-issues",
        category: "Navigation",
        title: "Your Issues",
        subtitle: "Issues assigned to you across all projects",
        icon: Flag,
        hotkey: "Jump to",
        onSelect: () => {
          onClose();
          router.push("/your-issues");
        },
      },
      {
        id: "nav-notifications",
        category: "Navigation",
        title: "Notifications",
        subtitle: "Mentions, unread alerts, and updates",
        icon: Bell,
        hotkey: "Jump to",
        onSelect: () => {
          onClose();
          router.push("/notifications");
        },
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Account Settings",
        subtitle: "Profile, preferences, and workspace security",
        icon: Settings,
        hotkey: "Jump to",
        onSelect: () => {
          onClose();
          router.push("/settings");
        },
      }
    );

    return items;
  }, [currentProjId, currentProject, router, onClose]);

  // Static Quick Actions
  const staticActionItems: PaletteItem[] = useMemo(() => {
    return [
      {
        id: "action-new-issue",
        category: "Quick Actions",
        title: "Create New Issue",
        subtitle: "Create issue in active project",
        icon: Plus,
        hotkey: "Hotkey C",
        onSelect: () => {
          onClose();
          onOpenCreateIssue?.();
        },
      },
      {
        id: "action-new-project",
        category: "Quick Actions",
        title: "Create New Project",
        subtitle: "Launch a new venture or repository",
        icon: Sparkles,
        hotkey: "Hotkey P",
        onSelect: () => {
          onClose();
          onOpenCreateProject?.();
        },
      },
      {
        id: "action-new-page",
        category: "Quick Actions",
        title: "Create New Document",
        subtitle: "Start writing a technical spec or PRD",
        icon: FileText,
        hotkey: "Action",
        onSelect: () => {
          onClose();
          if (onOpenCreateDocument) {
            onOpenCreateDocument();
          } else if (currentProjId) {
            router.push(`/projects/${currentProjId}/pages`);
          }
        },
      },
    ];
  }, [onClose, onOpenCreateIssue, onOpenCreateProject, onOpenCreateDocument, currentProjId, router]);

  // Dynamic Workspace Search Items
  const dynamicItems: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [];

    // Projects Results
    searchResults.projects.forEach((p) => {
      list.push({
        id: `search-project-${p.id}`,
        category: "Projects",
        title: p.name || p.title,
        subtitle: `${p.identifier} · Project repository`,
        icon: FolderKanban,
        onSelect: () => {
          onClose();
          router.push(`/projects/${p.id}/board`);
        },
      });
    });

    // Issues Results
    searchResults.issues.forEach((issue) => {
      const ident = issue.project?.identifier
        ? `${issue.project.identifier}-${issue.sequence_id}`
        : `#${issue.sequence_id}`;
      const stateIcon =
        issue.state === "done" ? CheckCircle2 : issue.state === "in_progress" ? Clock : Circle;

      list.push({
        id: `search-issue-${issue.id}`,
        category: "Issues",
        title: `${ident}: ${issue.title}`,
        subtitle: `${issue.project?.name || "Project"} · ${issue.state} · ${issue.priority || "no priority"}`,
        icon: stateIcon,
        onSelect: () => {
          onClose();
          if (issue.project_id) {
            router.push(`/projects/${issue.project_id}/board`);
          }
        },
      });
    });

    // Cycles Results
    searchResults.cycles.forEach((c) => {
      list.push({
        id: `search-cycle-${c.id}`,
        category: "Cycles",
        title: `Sprint: ${c.name}`,
        subtitle: `${c.project?.name || "Project"} · ${c.status}`,
        icon: RotateCw,
        onSelect: () => {
          onClose();
          if (c.project_id) {
            router.push(`/projects/${c.project_id}/cycles`);
          }
        },
      });
    });

    // Modules Results
    searchResults.modules.forEach((m) => {
      list.push({
        id: `search-module-${m.id}`,
        category: "Modules",
        title: `Module: ${m.name}`,
        subtitle: `${m.project?.name || "Project"} · ${m.status}`,
        icon: Layers,
        onSelect: () => {
          onClose();
          if (m.project_id) {
            router.push(`/projects/${m.project_id}/modules`);
          }
        },
      });
    });

    // Pages Results
    searchResults.pages.forEach((page) => {
      list.push({
        id: `search-page-${page.id}`,
        category: "Pages",
        title: `Doc: ${page.title}`,
        subtitle: `${page.project?.name || "Project"} · Updated ${new Date(page.updated_at).toLocaleDateString()}`,
        icon: FileText,
        onSelect: () => {
          onClose();
          if (page.project_id) {
            router.push(`/projects/${page.project_id}/pages?pageId=${page.id}`);
          }
        },
      });
    });

    return list;
  }, [searchResults, onClose, router]);

  // Combine and filter items based on user query
  const allDisplayItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      // Default initial view: Quick Actions, Navigation, and Projects list
      const projectListItems: PaletteItem[] = projects.map((p) => ({
        id: `proj-${p.id}`,
        category: "Projects",
        title: p.name,
        subtitle: `${p.identifier} · ${p.issue_count} issues · ${p.active_cycle_count} sprints`,
        icon: FolderKanban,
        onSelect: () => {
          onClose();
          router.push(`/projects/${p.id}/board`);
        },
      }));

      return [...staticActionItems, ...staticNavigationItems, ...projectListItems];
    }

    // Filter static items by query
    const filteredStaticActions = staticActionItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    const filteredStaticNav = staticNavigationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    return [...filteredStaticActions, ...filteredStaticNav, ...dynamicItems];
  }, [query, staticActionItems, staticNavigationItems, projects, dynamicItems, onClose, router]);

  // Keyboard navigation (Up, Down, Enter, Escape)
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
        setSelectedIndex((prev) => (prev + 1) % (allDisplayItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (allDisplayItems.length || 1)) % (allDisplayItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allDisplayItems[selectedIndex]) {
          allDisplayItems[selectedIndex].onSelect();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allDisplayItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0d1424] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#0a0f1d] shrink-0">
          <Search size={18} className="text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search issues, projects, cycles, modules, docs..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {searchLoading && <Loader2 size={15} className="animate-spin text-cyan-400 shrink-0" />}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-white p-1 rounded"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline font-mono text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {allDisplayItems.length === 0 ? (
            <div className="py-14 text-center">
              <Search size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-300 font-semibold font-display">No results found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching by issue identifier (e.g. #INN-1), keyword, or document title.
              </p>
            </div>
          ) : (
            allDisplayItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/25"
                      : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        isSelected
                          ? "bg-cyan-400/20 border-cyan-400/30 text-cyan-300"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-white" : "text-slate-200"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      {item.hotkey || item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} className="text-cyan-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-[#090d18] flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400/90 font-medium">IBF Plane Engine (Cmd+K)</span>
        </div>
      </div>
    </div>
  );
}
