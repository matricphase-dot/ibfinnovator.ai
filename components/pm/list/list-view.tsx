"use client";

import React from "react";
import { Issue } from "../issue-card";
import { PrioritySelect, Priority } from "../priority-select";
import { StateSelect, IssueState } from "../state-select";
import { Calendar, User } from "lucide-react";

interface ListViewProps {
  issues: Issue[];
  projectIdentifier?: string;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
  onIssuePriorityChange: (issueId: string, newPriority: Priority) => void;
}

export function ListView({
  issues,
  projectIdentifier = "INN",
  onSelectIssue,
  onIssueStateChange,
  onIssuePriorityChange,
}: ListViewProps) {
  return (
    <div className="w-full bg-[#080d18] border border-white/[0.06] rounded-2xl overflow-hidden shadow-inner">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 w-28">Identifier</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 w-36">State</th>
              <th className="py-3 px-4 w-36">Priority</th>
              <th className="py-3 px-4 w-36">Assignee</th>
              <th className="py-3 px-4 w-32">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {issues.map((issue) => {
              const assigneeName =
                issue.assignee?.full_name || issue.assignee?.name || issue.assignee?.username;

              return (
                <tr
                  key={issue.id}
                  className="hover:bg-white/[0.02] transition group"
                >
                  {/* Identifier */}
                  <td
                    onClick={() => onSelectIssue?.(issue)}
                    className="py-3 px-4 font-mono font-bold text-slate-400 group-hover:text-cyan-300 transition cursor-pointer"
                  >
                    {projectIdentifier}-{issue.sequence_id}
                  </td>

                  {/* Title */}
                  <td
                    onClick={() => onSelectIssue?.(issue)}
                    className="py-3 px-4 font-semibold text-white max-w-md truncate cursor-pointer hover:text-cyan-300 transition"
                  >
                    {issue.title}
                  </td>

                  {/* State Picker */}
                  <td className="py-2.5 px-4">
                    <StateSelect
                      value={issue.state}
                      onChange={(s) => onIssueStateChange(issue.id, s)}
                    />
                  </td>

                  {/* Priority Picker */}
                  <td className="py-2.5 px-4">
                    <PrioritySelect
                      value={issue.priority}
                      onChange={(p) => onIssuePriorityChange(issue.id, p)}
                    />
                  </td>

                  {/* Assignee */}
                  <td className="py-3 px-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {issue.assignee?.avatar_url ? (
                        <img
                          src={issue.assignee.avatar_url}
                          alt={assigneeName || "avatar"}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-cyan-300/10 text-cyan-300 grid place-items-center text-[10px] font-bold">
                          {assigneeName ? assigneeName.slice(0, 1).toUpperCase() : <User size={10} />}
                        </div>
                      )}
                      <span className="truncate max-w-[90px]">{assigneeName || "Unassigned"}</span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 text-slate-400">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Calendar size={12} className="text-slate-500" />
                      {issue.due_date || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {issues.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  No issues found in this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
