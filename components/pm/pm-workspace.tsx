"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { KanbanBoard } from "@/components/ibf/board/kanban-board";
import { ListView } from "@/components/ibf/list/list-view";
import { CyclesView, Cycle } from "@/components/pm/cycles/cycles-view";
import { IssueModal } from "@/components/ibf/issues/issue-modal";
import { Issue } from "@/components/ibf/board/issue-card";
import { IssueState } from "@/components/pm/state-select";
import { Priority } from "@/components/pm/priority-select";
import { IssueDrawer } from "@/components/ibf/issues/issue-drawer";
import { ModulesView } from "@/components/ibf/modules/modules-view";
import { PagesView } from "@/components/ibf/pages/pages-view";
import { useSupabaseBrowser } from "@/lib/supabase/browser";
import {
  Kanban,
  List,
  RotateCw,
  Layers,
  FileText,
  Plus,
  ArrowLeft,
  Loader2,
  FolderKanban,
  Filter,
  MessageSquare,
} from "lucide-react";

export type PMTab = "board" | "list" | "cycles" | "modules" | "pages";

interface ProjectManagementWorkspaceProps {
  projectId: string;
  projectName: string;
  projectIdentifier: string;
  initialTab?: PMTab;
  currentTab?: PMTab;
  onTabChange?: (tab: PMTab) => void;
  hideTopBar?: boolean;
}

export function ProjectManagementWorkspace({
  projectId,
  projectName,
  projectIdentifier = "INN",
  initialTab = "board",
  currentTab,
  onTabChange,
  hideTopBar = false,
}: ProjectManagementWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PMTab>(currentTab || initialTab);

  useEffect(() => {
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab, activeTab]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quick creator modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultState, setModalDefaultState] = useState<IssueState>("todo");

  // 720px Side-Peek drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerIssue, setDrawerIssue] = useState<Issue | null>(null);

  const supabase = useSupabaseBrowser();

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [issuesRes, cyclesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/issues`),
          fetch(`/api/projects/${projectId}/cycles`),
        ]);

        if (!issuesRes.ok) throw new Error("Failed to load project issues");
        if (!cyclesRes.ok) throw new Error("Failed to load cycles");

        const [issuesData, cyclesData] = await Promise.all([
          issuesRes.json(),
          cyclesRes.json(),
        ]);

        setIssues(issuesData || []);
        setCycles(cyclesData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load project management data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Realtime Supabase Subscription for Multi-User Live Board
  useEffect(() => {
    const channel = supabase
      .channel(`pm-issues-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newIssue = payload.new as Issue;
            setIssues((prev) => {
              if (prev.some((i) => i.id === newIssue.id)) return prev;
              return [newIssue, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Issue;
            setIssues((prev) =>
              prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
            );
            setDrawerIssue((prev) =>
              prev && prev.id === updated.id ? { ...prev, ...updated } : prev
            );
          } else if (payload.eventType === "DELETE") {
            setIssues((prev) => prev.filter((i) => i.id !== payload.old.id));
            setDrawerIssue((prev) =>
              prev && prev.id === payload.old.id ? null : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  // Tab change handler with history sync
  function handleTabChange(tab: PMTab) {
    setActiveTab(tab);
    onTabChange?.(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/projects/${projectId}/${tab}`);
    }
  }

  // Optimistic State Update
  async function handleStateChange(issueId: string, newState: IssueState) {
    const current = issues.find((i) => i.id === issueId);
    if (current && current.state === newState) return;

    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, state: newState } : i))
    );

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (!res.ok) throw new Error("Failed to sync state change");
    } catch {
      setIssues(previousIssues);
    }
  }

  // Optimistic Priority Update
  async function handlePriorityChange(issueId: string, newPriority: Priority) {
    const current = issues.find((i) => i.id === issueId);
    if (current && current.priority === newPriority) return;

    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, priority: newPriority } : i))
    );

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error("Failed to sync priority change");
    } catch {
      setIssues(previousIssues);
    }
  }

  // Open 720px Side-Peek Drawer on issue select
  function handleSelectIssue(issue: Issue) {
    setDrawerIssue(issue);
    setDrawerOpen(true);
  }

  function handleSelectIssueById(issueId: string) {
    const found = issues.find((i) => i.id === issueId);
    if (found) {
      setDrawerIssue(found);
      setDrawerOpen(true);
    } else {
      fetch(`/api/issues/${issueId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((issue) => {
          if (issue) {
            setDrawerIssue(issue);
            setDrawerOpen(true);
          }
        })
        .catch(() => {});
    }
  }

  // Open quick creator modal
  function openCreateModal(defaultState: IssueState = "todo") {
    setModalDefaultState(defaultState);
    setModalOpen(true);
  }

  function handleIssueCreated(newIssue: Issue) {
    setIssues((prev) => {
      if (prev.some((i) => i.id === newIssue.id)) return prev;
      return [newIssue, ...prev];
    });
  }

  // Rapid inline card creation directly from Kanban column
  async function handleInlineCreate(title: string, state: IssueState) {
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          state,
          cycle_id:
            selectedCycleId !== "all" && selectedCycleId !== "unassigned"
              ? selectedCycleId
              : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create issue inline");
      const created = await res.json();
      handleIssueCreated(created);
    } catch (err) {
      console.error(err);
    }
  }

  function handleIssueUpdated(updated: Issue) {
    setIssues((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
    setDrawerIssue((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev
    );
  }

  function handleIssueDeleted(issueId: string) {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    if (drawerIssue?.id === issueId) {
      setDrawerOpen(false);
      setDrawerIssue(null);
    }
  }

  function handleCycleCreated(newCycle: Cycle) {
    setCycles((prev) => [newCycle, ...prev]);
  }

  // Filter issues by sprint
  const filteredIssues = issues.filter((i) => {
    if (selectedCycleId === "all") return true;
    if (selectedCycleId === "unassigned") return !i.cycle_id;
    return i.cycle_id === selectedCycleId;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#070b14] text-slate-100">
      {/* Top Workspace Bar or Sub-Filter Bar */}
      {hideTopBar ? (
        cycles.length > 0 && (activeTab === "board" || activeTab === "list") ? (
          <div className="px-6 py-2.5 border-b border-white/[0.04] bg-[#090e1a] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400">SPRINT FILTER:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="appearance-none pl-7 pr-4 py-1 bg-[#0e1626] border border-white/[0.08] rounded-lg text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
                >
                  <option value="all">All Sprints</option>
                  <option value="unassigned">Backlog (No Sprint)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      Sprint: {c.name} ({c.status})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2 text-slate-400">
                  <Filter size={12} />
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {filteredIssues.length} issues
            </div>
          </div>
        ) : null
      ) : (
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 bg-[#0a0f1e]/60 backdrop-blur-md sticky top-16 z-30">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              title="Back to project overview"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-300/10 border border-cyan-300/20 text-cyan-300 grid place-items-center font-bold text-xs">
                <FolderKanban size={16} />
              </span>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  {projectName}
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-300/10 text-cyan-300 border border-cyan-300/20">
                    {projectIdentifier}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  {filteredIssues.length} Issues · {cycles.length} Sprints
                </p>
              </div>
            </div>
          </div>

        {/* View Switchers (Board, List, Cycles, Modules, Pages) & Sprint Filter */}
        <div className="flex items-center gap-3">
          {/* Sprint Filter */}
          {cycles.length > 0 && (activeTab === "board" || activeTab === "list") && (
            <div className="relative inline-flex items-center">
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="appearance-none pl-7 pr-4 py-1.5 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="all">All Sprints</option>
                <option value="unassigned">Backlog (No Sprint)</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    Sprint: {c.name} ({c.status})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute left-2 text-slate-400">
                <Filter size={12} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-[#0e1626] border border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleTabChange("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "board"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban size={14} />
              Board
            </button>
            <button
              onClick={() => handleTabChange("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "list"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => handleTabChange("cycles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "cycles"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RotateCw size={14} />
              Cycles
            </button>
            <button
              onClick={() => handleTabChange("modules")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "modules"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={14} />
              Modules
            </button>
            <button
              onClick={() => handleTabChange("pages")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "pages"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText size={14} />
              Pages
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/20 transition hover:scale-[1.02]"
            title="Open Team Chat"
          >
            <MessageSquare size={14} />
            Team Chat
          </Link>
          <button
            onClick={() => openCreateModal("todo")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-300 hover:bg-cyan-200 text-slate-950 text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Plus size={15} />
            New Issue
          </button>
        </div>
      </div>
    )}

      {/* Main Workspace View Container */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={18} className="animate-spin text-cyan-300" />
              Loading project management workspace…
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        ) : (
          <>
            {activeTab === "board" && (
              <KanbanBoard
                issues={filteredIssues}
                projectIdentifier={projectIdentifier}
                onOpenCreateModal={openCreateModal}
                onSelectIssue={handleSelectIssue}
                onIssueStateChange={handleStateChange}
                onInlineCreate={handleInlineCreate}
              />
            )}

            {activeTab === "list" && (
              <ListView
                issues={filteredIssues}
                projectIdentifier={projectIdentifier}
                onSelectIssue={handleSelectIssue}
                onIssueStateChange={handleStateChange}
                onIssuePriorityChange={handlePriorityChange}
              />
            )}

            {activeTab === "cycles" && (
              <CyclesView
                cycles={cycles}
                projectId={projectId}
                onCycleCreated={handleCycleCreated}
              />
            )}

            {activeTab === "modules" && (
              <ModulesView
                projectId={projectId}
                projectIdentifier={projectIdentifier}
                onSelectIssue={handleSelectIssueById}
                onSelectModule={(modId) => {
                  // Switch to board or filter
                  handleTabChange("board");
                }}
              />
            )}

            {activeTab === "pages" && (
              <PagesView projectId={projectId} onOpenIssue={handleSelectIssueById} />
            )}
          </>
        )}
      </div>

      {/* 720px Side-Peek Issue Drawer */}
      <IssueDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerIssue(null);
        }}
        issue={drawerIssue}
        projectId={projectId}
        projectIdentifier={projectIdentifier}
        cycles={cycles}
        onIssueUpdated={handleIssueUpdated}
        onIssueDeleted={handleIssueDeleted}
      />

      {/* Issue Modal (Quick Creator) */}
      <IssueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        issue={null}
        cycles={cycles}
        defaultState={modalDefaultState}
        onIssueCreated={handleIssueCreated}
        onIssueUpdated={handleIssueUpdated}
        onIssueDeleted={handleIssueDeleted}
      />
    </div>
  );
}
