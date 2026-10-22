"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Cycle } from "@/components/pm/cycles/cycles-view";
import { Issue } from "../board/issue-card";
import { PriorityIcon } from "@/components/pm/priority-select";
import { StateIcon } from "@/components/pm/state-select";
import {
  X,
  Search,
  Plus,
  Minus,
  Loader2,
  Check,
  FolderKanban,
  RotateCw,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface CycleBacklogTrayProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: Cycle;
  projectId: string;
  projectIdentifier?: string;
  onIssuesUpdated: () => void;
}

export function CycleBacklogTray({
  isOpen,
  onClose,
  cycle,
  projectId,
  projectIdentifier = "INN",
  onIssuesUpdated,
}: CycleBacklogTrayProps) {
  const [allProjectIssues, setAllProjectIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function loadIssues() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/issues`);
        if (res.ok) {
          const data = await res.json();
          setAllProjectIssues(data || []);
        }
      } catch (err) {
        console.error("Failed to load project issues for backlog tray", err);
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, [isOpen, projectId]);

  // Separate cycle issues from backlog issues
  const { cycleIssues, backlogIssues } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cycleList: Issue[] = [];
    const backlogList: Issue[] = [];

    allProjectIssues.forEach((issue) => {
      const match =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        `${projectIdentifier}-${issue.sequence_id}`.toLowerCase().includes(q);

      if (issue.cycle_id === cycle.id) {
        if (match) cycleList.push(issue);
      } else if (!issue.cycle_id) {
        if (match) backlogList.push(issue);
      }
    });

    return { cycleIssues: cycleList, backlogIssues: backlogList };
  }, [allProjectIssues, cycle.id, searchQuery, projectIdentifier]);

  if (!isOpen) return null;

  async function handleTransfer(issueId: string, targetCycleId: string | null) {
    setUpdatingId(issueId);

    // Optimistic local state update
    setAllProjectIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, cycle_id: targetCycleId } : i))
    );

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle_id: targetCycleId }),
      });

      if (!res.ok) throw new Error("Failed to transfer issue");
      onIssuesUpdated();
    } catch (err) {
      console.error(err);
      // Revert on error
      setAllProjectIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, cycle_id: targetCycleId ? null : cycle.id } : i
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-4xl h-full bg-[#080c14] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0b101c]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-cyan-400/10 text-cyan-300 grid place-items-center border border-cyan-400/20 font-bold text-xs">
              <RotateCw size={14} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Backlog Assignment Tray
                <span className="text-xs font-normal text-cyan-300 font-mono">
                  ({cycle.name})
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Move issues directly between the unassigned Backlog and this Sprint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-7 pr-3 py-1 bg-[#0e1626] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2-Column Split View: Current Sprint Issues (Left) vs Unassigned Backlog (Right) */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-cyan-300" />
            Loading backlog and sprint scope...
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            {/* LEFT: Current Sprint Scope */}
            <div className="flex flex-col h-full overflow-hidden bg-[#070b14]">
              <div className="px-5 py-3 border-b border-white/[0.04] bg-[#090e1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    In Sprint Scope
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  {cycleIssues.length} issues
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cycleIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-[#0d1424] border border-white/[0.06] hover:border-cyan-400/30 rounded-xl transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <StateIcon state={issue.state} size={14} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-white truncate">
                          {issue.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>
                            {projectIdentifier}-{issue.sequence_id}
                          </span>
                          <PriorityIcon priority={issue.priority} size={11} />
                          {issue.estimate_points !== null && issue.estimate_points !== undefined && (
                            <span>{issue.estimate_points} pts</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTransfer(issue.id, null)}
                      disabled={updatingId === issue.id}
                      title="Remove from sprint to backlog"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                    >
                      {updatingId === issue.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Minus size={13} />
                      )}
                    </button>
                  </div>
                ))}

                {cycleIssues.length === 0 && (
                  <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-1">
                    <span>Sprint scope is currently empty.</span>
                    <span className="text-[11px] text-slate-600">
                      Add issues from the backlog on the right →
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Unassigned Project Backlog */}
            <div className="flex flex-col h-full overflow-hidden bg-[#060a12]">
              <div className="px-5 py-3 border-b border-white/[0.04] bg-[#080d17] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Unassigned Backlog
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {backlogIssues.length} issues
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {backlogIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-[#0a0f1d] border border-white/[0.04] hover:border-cyan-400/30 rounded-xl transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <StateIcon state={issue.state} size={14} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                          {issue.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>
                            {projectIdentifier}-{issue.sequence_id}
                          </span>
                          <PriorityIcon priority={issue.priority} size={11} />
                          {issue.estimate_points !== null && issue.estimate_points !== undefined && (
                            <span>{issue.estimate_points} pts</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTransfer(issue.id, cycle.id)}
                      disabled={updatingId === issue.id}
                      title="Add to current sprint"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 transition shrink-0"
                    >
                      {updatingId === issue.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}

                {backlogIssues.length === 0 && (
                  <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-1">
                    <span>No unassigned backlog issues found.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs bg-[#090e1a]">
          <span className="text-slate-400">
            Changes save automatically to PostgreSQL.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
