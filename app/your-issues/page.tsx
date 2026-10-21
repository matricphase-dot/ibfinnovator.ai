"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { IssueDrawer } from "@/components/ibf/issues/issue-drawer";
import { Issue } from "@/components/pm/issue-card";
import { Priority, PriorityIcon } from "@/components/pm/priority-select";
import { IssueState, StateIcon, STATE_CONFIG } from "@/components/pm/state-select";
import {
  Flag,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Loader2,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function YourIssuesPage() {
  const [filterType, setFilterType] = useState<"assigned" | "created">("assigned");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // 720px side-peek drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerIssue, setDrawerIssue] = useState<Issue | null>(null);

  useEffect(() => {
    async function loadIssues() {
      setLoading(true);
      try {
        const param = filterType === "assigned" ? "assigned=true" : "created=true";
        const res = await fetch(`/api/issues?${param}`);
        if (res.ok) {
          const data = await res.json();
          setIssues(data.issues || []);
        }
      } catch (err) {
        console.error("Failed to load your issues:", err);
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, [filterType]);

  const filteredIssues = issues.filter((i) => {
    if (stateFilter !== "all" && i.state !== stateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = i.title?.toLowerCase().includes(q);
      const matchDesc = i.description?.toLowerCase().includes(q);
      const matchProj = (i as any).project?.name?.toLowerCase().includes(q) || (i as any).project?.identifier?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchProj;
    }
    return true;
  });

  function handleSelectIssue(issue: Issue) {
    setDrawerIssue(issue);
    setDrawerOpen(true);
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

  return (
    <AppShell
      breadcrumbs={[
        { label: "IBF Foundry", href: "/dashboard" },
        { label: "Your Issues" },
      ]}
    >
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] uppercase tracking-wider font-bold">
              <Flag size={14} />
              Cross-Project Task Tracker
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Your Issues
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              All issues and action items assigned to or created by you across projects.
            </p>
          </div>

          {/* Filter Tabs: Assigned to me vs Created by me */}
          <div className="flex items-center gap-1 p-1 bg-[#0e1626] border border-white/[0.08] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("assigned")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "assigned"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Assigned to me
            </button>
            <button
              type="button"
              onClick={() => setFilterType("created")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "created"
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Created by me
            </button>
          </div>
        </div>

        {/* Toolbar: Search & State Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Filter issues by title, identifier, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0d1424] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/60"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="appearance-none pl-7 pr-4 py-1.5 bg-[#0d1424] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="canceled">Canceled</option>
              </select>
              <Filter size={12} className="absolute left-2.5 text-slate-500 pointer-events-none" />
            </div>

            <span className="text-xs font-mono text-slate-500">
              {filteredIssues.length} {filteredIssues.length === 1 ? "issue" : "issues"}
            </span>
          </div>
        </div>

        {/* Issues List Table */}
        <div className="bg-[#0d1424] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-300" />
              Loading your issues…
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-white">You're all caught up!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {filterType === "assigned"
                  ? "No open issues are currently assigned to you."
                  : "You haven't created any issues yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredIssues.map((issue: any) => {
                const projectIdent = issue.project?.identifier || "INN";
                const projectName = issue.project?.name || issue.project?.title || "Project";
                const seqLabel = `${projectIdent}-${issue.sequence_id || 1}`;

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer group"
                  >
                    {/* Left: Project tag + Identifier + Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* State Icon */}
                      <div className="flex-shrink-0">
                        {issue.state === "done" ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : issue.state === "in_progress" ? (
                          <Clock size={16} className="text-amber-400" />
                        ) : (
                          <Circle size={16} className="text-slate-500" />
                        )}
                      </div>

                      {/* Project Monogram & Identifier Tag */}
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 flex-shrink-0 font-bold">
                        {seqLabel}
                      </span>

                      {/* Title */}
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition truncate">
                        {issue.title}
                      </span>

                      {/* Project Name Subtle Tag */}
                      <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 truncate">
                        in {projectName}
                      </span>
                    </div>

                    {/* Right: State & Priority Badges */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {issue.state && STATE_CONFIG[issue.state as IssueState] && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATE_CONFIG[issue.state as IssueState].bg} ${STATE_CONFIG[issue.state as IssueState].color} ${STATE_CONFIG[issue.state as IssueState].border}`}
                        >
                          <StateIcon state={issue.state as IssueState} size={12} />
                          {STATE_CONFIG[issue.state as IssueState].label}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 border border-white/5 text-slate-300">
                        <PriorityIcon priority={issue.priority || "none"} size={12} />
                        <span className="capitalize">{issue.priority || "none"}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 720px Side-Peek Drawer */}
      {drawerIssue && (
        <IssueDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          issue={drawerIssue}
          projectId={drawerIssue.project_id || (drawerIssue as any)?.project?.id || ""}
          projectIdentifier={
            (drawerIssue as any)?.project?.identifier || "INN"
          }
          onIssueUpdated={handleIssueUpdated}
          onIssueDeleted={handleIssueDeleted}
        />
      )}
    </AppShell>
  );
}
