"use client";

import React, { useState, useMemo } from "react";
import { Issue } from "./issue-card";
import { KanbanColumn } from "./kanban-column";
import { IssueState } from "@/components/pm/state-select";
import { Search, ArrowUpDown, Filter } from "lucide-react";

export const BOARD_COLUMNS: { state: IssueState; label: string }[] = [
  { state: "backlog", label: "Backlog" },
  { state: "todo", label: "To Do" },
  { state: "in_progress", label: "In Progress" },
  { state: "done", label: "Done" },
  { state: "canceled", label: "Canceled" },
];

export type BoardSortOption = "manual" | "priority" | "due_date" | "sequence";

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

interface KanbanBoardProps {
  issues: Issue[];
  projectIdentifier?: string;
  onOpenCreateModal: (defaultState: IssueState) => void;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
  onInlineCreate?: (title: string, state: IssueState) => Promise<void> | void;
}

export function KanbanBoard({
  issues,
  projectIdentifier = "INN",
  onOpenCreateModal,
  onSelectIssue,
  onIssueStateChange,
  onInlineCreate,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<BoardSortOption>("manual");

  // Filter and sort issues
  const processedIssues = useMemo(() => {
    let result = [...issues];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          `${projectIdentifier}-${i.sequence_id}`.toLowerCase().includes(q) ||
          i.assignee?.full_name?.toLowerCase().includes(q) ||
          i.assignee?.name?.toLowerCase().includes(q) ||
          i.assignee?.username?.toLowerCase().includes(q) ||
          i.module?.name?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "priority") {
      result.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)
      );
    } else if (sortBy === "due_date") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (sortBy === "sequence") {
      result.sort((a, b) => b.sequence_id - a.sequence_id);
    }

    return result;
  }, [issues, searchQuery, sortBy, projectIdentifier]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-3">
      {/* Board Controls: Search & Sort Bar */}
      <div className="flex items-center justify-between gap-3 px-1 py-1 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search board issues..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0f1d] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center">
            <ArrowUpDown
              size={12}
              className="absolute left-2.5 text-slate-400 pointer-events-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BoardSortOption)}
              className="appearance-none pl-7 pr-4 py-1.5 bg-[#0a0f1d] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
            >
              <option value="manual">Sort: Default</option>
              <option value="priority">Sort: Priority (Urgent 1st)</option>
              <option value="due_date">Sort: Due Date</option>
              <option value="sequence">Sort: Newest Sequence</option>
            </select>
          </div>
          <span className="text-[11px] font-mono text-slate-500 px-1">
            {processedIssues.length} visible
          </span>
        </div>
      </div>

      {/* 5-Lane Kanban Grid */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10">
        <div className="grid grid-cols-5 gap-4 min-w-[1100px] h-full items-start">
          {BOARD_COLUMNS.map((col) => {
            const colIssues = processedIssues.filter((i) => i.state === col.state);

            return (
              <KanbanColumn
                key={col.state}
                state={col.state}
                label={col.label}
                issues={colIssues}
                projectIdentifier={projectIdentifier}
                onSelectIssue={onSelectIssue}
                onIssueStateChange={onIssueStateChange}
                onInlineCreate={onInlineCreate}
                onOpenCreateModal={onOpenCreateModal}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
