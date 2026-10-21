"use client";

import React from "react";
import { PriorityIcon, Priority } from "./priority-select";
import { StateIcon, IssueState } from "./state-select";
import { Calendar, User } from "lucide-react";

import { Label, Module } from "@/types/database.types";

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

  return (
    <div
      onClick={onClick}
      className="p-3.5 bg-[#0e1626] hover:bg-[#131d31] border border-white/[0.08] hover:border-cyan-300/30 rounded-xl transition cursor-pointer select-none group shadow-sm flex flex-col gap-2.5"
    >
      {/* Header: ID + State */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 transition">
          {projectIdentifier}-{issue.sequence_id}
        </span>
        <div className="flex items-center gap-1.5">
          {issue.estimate_points !== null && issue.estimate_points !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
              {issue.estimate_points} pts
            </span>
          )}
          <StateIcon state={issue.state} size={14} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
        {issue.title}
      </h3>

      {/* Labels & Module Tags */}
      {((issue.labels && issue.labels.length > 0) || issue.module) && (
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
        </div>
      )}

      {/* Footer: Priority + Assignee + Due Date */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px] text-slate-400">
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
          <div className="flex items-center gap-1" title={assigneeName || "Assignee"}>
            {issue.assignee.avatar_url ? (
              <img
                src={issue.assignee.avatar_url}
                alt={assigneeName || "avatar"}
                className="w-5 h-5 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-[10px] font-bold">
                {(assigneeName || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <span title="Unassigned" className="text-slate-600">
            <User size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
