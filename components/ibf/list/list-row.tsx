"use client";

import React, { useRef, useEffect } from "react";
import { Issue } from "../board/issue-card";
import { StateSelect, IssueState } from "@/components/pm/state-select";
import { PrioritySelect, Priority } from "@/components/pm/priority-select";
import { Calendar, User, CheckSquare } from "lucide-react";
import { PlaneAvatar, PlaneSequenceBadge } from "@/components/ibf/ui";

interface ListRowProps {
  issue: Issue;
  projectIdentifier?: string;
  isFocused?: boolean;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
  onIssuePriorityChange: (issueId: string, newPriority: Priority) => void;
}

export function ListRow({
  issue,
  projectIdentifier = "INN",
  isFocused = false,
  onSelectIssue,
  onIssueStateChange,
  onIssuePriorityChange,
}: ListRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isFocused]);

  const assigneeName =
    issue.assignee?.full_name || issue.assignee?.name || issue.assignee?.username;

  const totalSubtasks =
    issue.subtask_count?.total ??
    (issue.subtasks ? issue.subtasks.length : 0);
  const completedSubtasks =
    issue.subtask_count?.completed ??
    (issue.subtasks ? issue.subtasks.filter((s) => s.state === "done").length : 0);
  const hasSubtasks = totalSubtasks > 0;
  const allSubtasksDone = hasSubtasks && completedSubtasks === totalSubtasks;

  return (
    <tr
      ref={rowRef}
      onClick={() => onSelectIssue?.(issue)}
      className={`group cursor-pointer transition-colors duration-150 border-b border-slate-100 ${
        isFocused
          ? "bg-cyan-50/80 border-l-2 border-l-cyan-500"
          : "hover:bg-slate-50/80"
      }`}
    >
      {/* Identifier */}
      <td className="py-2.5 px-4 w-28 select-none">
        <PlaneSequenceBadge
          identifier={projectIdentifier}
          sequence={issue.sequence_id}
          className="group-hover:text-cyan-600"
        />
      </td>

      {/* Title & Metadata Tags */}
      <td className="py-2.5 px-4 text-xs">
        <div className="flex items-center gap-2 max-w-xl">
          <span className="font-semibold text-slate-900 group-hover:text-cyan-700 truncate transition-colors">
            {issue.title}
          </span>
          {issue.module && (
            <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 truncate max-w-[120px]">
              ⊡ {issue.module.name}
            </span>
          )}
          {hasSubtasks && (
            <span
              className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                allSubtasksDone
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
              title={`Subtasks: ${completedSubtasks} of ${totalSubtasks} completed`}
            >
              <CheckSquare size={10} className={allSubtasksDone ? "text-emerald-600" : "text-slate-400"} />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>
      </td>

      {/* State Picker */}
      <td className="py-2 px-4 w-36" onClick={(e) => e.stopPropagation()}>
        <StateSelect
          value={issue.state}
          onChange={(s) => onIssueStateChange(issue.id, s)}
        />
      </td>

      {/* Priority Picker */}
      <td className="py-2 px-4 w-36" onClick={(e) => e.stopPropagation()}>
        <PrioritySelect
          value={issue.priority}
          onChange={(p) => onIssuePriorityChange(issue.id, p)}
        />
      </td>

      {/* Assignee */}
      <td className="py-2.5 px-4 text-slate-400 w-36 text-xs">
        <div className="flex items-center gap-1.5" title={assigneeName || "Unassigned"}>
          {issue.assignee ? (
            <PlaneAvatar
              name={assigneeName || "Assignee"}
              src={issue.assignee.avatar_url || undefined}
              size="xs"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/5 text-slate-500 grid place-items-center text-[10px]">
              <User size={10} />
            </div>
          )}
          <span className="truncate max-w-[95px] text-slate-300">
            {assigneeName || "Unassigned"}
          </span>
        </div>
      </td>

      {/* Due Date & Estimate */}
      <td className="py-2.5 px-4 text-slate-400 w-36 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar size={11} className="text-slate-500" />
            {issue.due_date || "—"}
          </span>
          {issue.estimate_points !== null && issue.estimate_points !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 text-slate-400 border border-white/10">
              {issue.estimate_points}pt
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
