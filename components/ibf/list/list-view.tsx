"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Issue } from "../board/issue-card";
import { ListRow } from "./list-row";
import { ListGroup } from "./list-group";
import { Priority } from "@/components/pm/priority-select";
import { IssueState, STATE_CONFIG } from "@/components/pm/state-select";
import { Search, Layers, RotateCw, Filter, Sparkles, User, Flag } from "lucide-react";

export type GroupByOption = "state" | "priority" | "assignee" | "cycle" | "module" | "none";

interface ListViewProps {
  issues: Issue[];
  projectIdentifier?: string;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
  onIssuePriorityChange: (issueId: string, newPriority: Priority) => void;
}

const STATE_ORDER: IssueState[] = ["in_progress", "todo", "backlog", "done", "canceled"];
const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low", "none"];

export function ListView({
  issues,
  projectIdentifier = "INN",
  onSelectIssue,
  onIssueStateChange,
  onIssuePriorityChange,
}: ListViewProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>("state");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const q = searchQuery.toLowerCase().trim();
    return issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        `${projectIdentifier}-${i.sequence_id}`.toLowerCase().includes(q) ||
        i.assignee?.full_name?.toLowerCase().includes(q) ||
        i.assignee?.name?.toLowerCase().includes(q) ||
        i.module?.name?.toLowerCase().includes(q)
    );
  }, [issues, searchQuery, projectIdentifier]);

  // Keep focused index within valid bounds
  useEffect(() => {
    if (focusedIndex >= filteredIssues.length) {
      setFocusedIndex(Math.max(0, filteredIssues.length - 1));
    }
  }, [filteredIssues.length, focusedIndex]);

  // Global Keyboard Navigation (j/k, Enter, Space, s, p)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Down: 'j' or 'ArrowDown'
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredIssues.length - 1 ? prev + 1 : prev
        );
        return;
      }

      // Up: 'k' or 'ArrowUp'
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      const focusedIssue = filteredIssues[focusedIndex];
      if (!focusedIssue) return;

      // Open Drawer: 'Enter' or 'Space'
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectIssue?.(focusedIssue);
        return;
      }

      // Cycle State: 's'
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        const currIdx = STATE_ORDER.indexOf(focusedIssue.state);
        const nextState = STATE_ORDER[(currIdx + 1) % STATE_ORDER.length];
        onIssueStateChange(focusedIssue.id, nextState);
        return;
      }

      // Cycle Priority: 'p'
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        const currIdx = PRIORITY_ORDER.indexOf(focusedIssue.priority);
        const nextPriority = PRIORITY_ORDER[(currIdx + 1) % PRIORITY_ORDER.length];
        onIssuePriorityChange(focusedIssue.id, nextPriority);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredIssues, focusedIndex, onSelectIssue, onIssueStateChange, onIssuePriorityChange]);

  interface GroupSection {
    key: string;
    title: string;
    icon?: React.ReactNode;
    issues: Issue[];
  }

  // Grouping logic
  const groupedSections: GroupSection[] = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", title: "All Issues", issues: filteredIssues }];
    }

    if (groupBy === "state") {
      return STATE_ORDER.map((st) => ({
        key: st,
        title: STATE_CONFIG[st].label,
        icon: (
          <span
            className={`w-2 h-2 rounded-full ${STATE_CONFIG[st].bg} ${STATE_CONFIG[st].border} border mr-1`}
          />
        ),
        issues: filteredIssues.filter((i) => i.state === st),
      })).filter((group) => group.issues.length > 0);
    }

    if (groupBy === "priority") {
      return PRIORITY_ORDER.map((pr) => ({
        key: pr,
        title: pr.charAt(0).toUpperCase() + pr.slice(1) + " Priority",
        icon: <Flag size={12} className="text-slate-400 mr-1" />,
        issues: filteredIssues.filter((i) => i.priority === pr),
      })).filter((group) => group.issues.length > 0);
    }

    if (groupBy === "assignee") {
      const map = new Map<string, { title: string; issues: Issue[] }>();
      map.set("unassigned", { title: "Unassigned", issues: [] });

      filteredIssues.forEach((issue) => {
        const key = issue.assignee?.id || "unassigned";
        const title =
          issue.assignee?.full_name || issue.assignee?.name || "Unassigned";
        if (!map.has(key)) {
          map.set(key, { title, issues: [] });
        }
        map.get(key)!.issues.push(issue);
      });

      return Array.from(map.entries())
        .map(([key, data]) => ({
          key,
          title: data.title,
          icon: <User size={12} className="text-cyan-400 mr-1" />,
          issues: data.issues,
        }))
        .filter((group) => group.issues.length > 0);
    }

    if (groupBy === "module") {
      const map = new Map<string, { title: string; issues: Issue[] }>();
      map.set("none", { title: "No Module", issues: [] });

      filteredIssues.forEach((issue) => {
        const key = issue.module_id || "none";
        const title = issue.module?.name || "No Module";
        if (!map.has(key)) {
          map.set(key, { title, issues: [] });
        }
        map.get(key)!.issues.push(issue);
      });

      return Array.from(map.entries())
        .map(([key, data]) => ({
          key,
          title: data.title,
          icon: <Layers size={12} className="text-cyan-400 mr-1" />,
          issues: data.issues,
        }))
        .filter((group) => group.issues.length > 0);
    }

    if (groupBy === "cycle") {
      const map = new Map<string, { title: string; issues: Issue[] }>();
      map.set("backlog", { title: "Backlog (No Sprint)", issues: [] });

      filteredIssues.forEach((issue) => {
        const key = issue.cycle_id || "backlog";
        const title = issue.cycle_id ? "Active Sprint" : "Backlog (No Sprint)";
        if (!map.has(key)) {
          map.set(key, { title, issues: [] });
        }
        map.get(key)!.issues.push(issue);
      });

      return Array.from(map.entries())
        .map(([key, data]) => ({
          key,
          title: data.title,
          icon: <RotateCw size={12} className="text-cyan-400 mr-1" />,
          issues: data.issues,
        }))
        .filter((group) => group.issues.length > 0);
    }

    return [{ key: "all", title: "All Issues", icon: undefined, issues: filteredIssues }];
  }, [groupBy, filteredIssues]);

  // Map each issue to its index in filteredIssues for focus highlighting
  const issueIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredIssues.forEach((issue, index) => {
      map.set(issue.id, index);
    });
    return map;
  }, [filteredIssues]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* List Toolbar: Group By + Search + Keyboard Help */}
      <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues by title, ID, assignee..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0f1d] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Group By Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">GROUP BY:</span>
            <div className="relative inline-flex items-center">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#0a0f1d] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              >
                <option value="state">State</option>
                <option value="priority">Priority</option>
                <option value="assignee">Assignee</option>
                <option value="module">Module</option>
                <option value="cycle">Cycle</option>
                <option value="none">None (Flat)</option>
              </select>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-white/[0.02] border border-white/[0.05] px-2.5 py-1 rounded-lg">
            <span>Nav:</span>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">j</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">k</kbd>
            <span>Open:</span>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↵</kbd>
            <span>State:</span>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">s</kbd>
            <span>Priority:</span>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">p</kbd>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="w-full bg-[#080d18] border border-white/[0.06] rounded-2xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-slate-400 select-none">
                <th className="py-2.5 px-4 w-28">Identifier</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4 w-36">State</th>
                <th className="py-2.5 px-4 w-36">Priority</th>
                <th className="py-2.5 px-4 w-36">Assignee</th>
                <th className="py-2.5 px-4 w-36">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {groupedSections.map((section) => (
                <React.Fragment key={section.key}>
                  {groupBy !== "none" ? (
                    <ListGroup
                      title={section.title}
                      count={section.issues.length}
                      icon={section.icon}
                    >
                      {section.issues.map((issue) => {
                        const globalIndex = issueIndexMap.get(issue.id) ?? -1;
                        return (
                          <ListRow
                            key={issue.id}
                            issue={issue}
                            projectIdentifier={projectIdentifier}
                            isFocused={globalIndex === focusedIndex}
                            onSelectIssue={onSelectIssue}
                            onIssueStateChange={onIssueStateChange}
                            onIssuePriorityChange={onIssuePriorityChange}
                          />
                        );
                      })}
                    </ListGroup>
                  ) : (
                    section.issues.map((issue) => {
                      const globalIndex = issueIndexMap.get(issue.id) ?? -1;
                      return (
                        <ListRow
                          key={issue.id}
                          issue={issue}
                          projectIdentifier={projectIdentifier}
                          isFocused={globalIndex === focusedIndex}
                          onSelectIssue={onSelectIssue}
                          onIssueStateChange={onIssueStateChange}
                          onIssuePriorityChange={onIssuePriorityChange}
                        />
                      );
                    })
                  )}
                </React.Fragment>
              ))}

              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 text-xs">
                    {searchQuery ? "No matching issues found." : "No issues in this view."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
