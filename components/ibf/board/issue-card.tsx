"use client";

import React from "react";
import { PriorityIcon, Priority } from "@/components/pm/priority-select";
import { StateIcon, IssueState } from "@/components/pm/state-select";
import { Calendar, User, CheckSquare } from "lucide-react";
import { Label, Module } from "@/types/database.types";
import { PlaneAvatar, PlaneSequenceBadge } from "@/components/ibf/ui";

export interface Issue {
  id: string;
  project_id: string;
  sequence_id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  state: IssueState;
  due_date?: string | null;
  cycle_id?: string | null;
  module_id?: string | null;
  parent_issue_id?: string | null;
  estimate_points?: number | null;
  labels?: Label[];
  module?: Module | null;
  subtasks?: Array<{
    id: string;
    sequence_id: number;
    title: string;
    state: IssueState | string;
    priority?: Priority;
  }>;
  subtask_count?: {
    total: number;
    completed: number;
  };
  assignee?: {
    id: string;
    name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  project_identifier?: string;
}

interface IssueCardProps {
  issue: Issue;
  projectIdentifier?: string;
  onClick?: () => void;
  onStateChange?: (state: IssueState) => void;
}

export function IssueCard({
  issue,
  projectIdentifier = "INN",
  onClick,
}: IssueCardProps) {
  const assigneeName =
    issue.assignee?.full_name || issue.assignee?.name || issue.assignee?.username;

  // Subtask metrics calculation
  const totalSubtasks =
    issue.subtask_count?.total ??
    (issue.subtasks ? issue.subtasks.length : 0);
  const completedSubtasks =
    issue.subtask_count?.completed ??
    (issue.subtasks ? issue.subtasks.filter((s) => s.state === "done").length : 0);
  const hasSubtasks = totalSubtasks > 0;
  const allSubtasksDone = hasSubtasks && completedSubtasks === totalSubtasks;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="p-3 bg-[var(--plane-surface-1)] hover:bg-[var(--plane-surface-2)] border border-[var(--plane-border-subtle)] hover:border-[var(--plane-border-medium)] rounded-[var(--plane-radius-md)] transition-all duration-150 cursor-pointer select-none group shadow-xs hover:shadow-md flex flex-col gap-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
    >
      {/* Header: ID + Estimate + State */}
      <div className="flex items-center justify-between">
        <PlaneSequenceBadge
          identifier={projectIdentifier}
          sequence={issue.sequence_id}
          className="group-hover:text-cyan-300"
        />
        <div className="flex items-center gap-1.5">
          {issue.estimate_points !== null && issue.estimate_points !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 font-mono">
              {issue.estimate_points} pts
            </span>
          )}
          <StateIcon state={issue.state} size={14} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2 group-hover:text-slate-100">
        {issue.title}
      </h3>

      {/* Labels, Module Tags & Subtasks Pill */}
      {((issue.labels && issue.labels.length > 0) || issue.module || hasSubtasks) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {issue.module && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 truncate max-w-[130px]">
              ⊡ {issue.module.name}
            </span>
          )}
          {issue.labels?.map((label) => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md border truncate max-w-[100px]"
              style={{
                backgroundColor: `${label.color}15`,
                borderColor: `${label.color}35`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {hasSubtasks && (
            <span
              className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1 border ${
                allSubtasksDone
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
              title={`Subtasks: ${completedSubtasks} of ${totalSubtasks} completed`}
            >
              <CheckSquare size={11} className={allSubtasksDone ? "text-emerald-400" : "text-slate-400"} />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>
      )}

      {/* Footer: Priority + Due Date + Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--plane-border-subtle)] text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span title={`Priority: ${issue.priority}`}>
            <PriorityIcon priority={issue.priority} size={13} />
          </span>
          {issue.due_date && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={11} />
              {issue.due_date}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {issue.assignee ? (
          <PlaneAvatar
            name={assigneeName || "Assignee"}
            src={issue.assignee.avatar_url || undefined}
            size="xs"
          />
        ) : (
          <span title="Unassigned" className="text-slate-600">
            <User size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
