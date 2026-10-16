"use client";

import React, { useState } from "react";
import { IssueCard, Issue } from "../issue-card";
import { IssueState, STATE_CONFIG } from "../state-select";
import { Plus } from "lucide-react";

const COLUMNS: { state: IssueState; label: string }[] = [
  { state: "backlog", label: "Backlog" },
  { state: "todo", label: "To Do" },
  { state: "in_progress", label: "In Progress" },
  { state: "done", label: "Done" },
  { state: "canceled", label: "Canceled" },
];

interface KanbanBoardProps {
  issues: Issue[];
  projectIdentifier?: string;
  onOpenCreateModal: (defaultState: IssueState) => void;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
}

export function KanbanBoard({
  issues,
  projectIdentifier = "INN",
  onOpenCreateModal,
  onSelectIssue,
  onIssueStateChange,
}: KanbanBoardProps) {
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedIssueId(id);
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetState: IssueState) {
    e.preventDefault();
    const issueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    if (issueId) {
      onIssueStateChange(issueId, targetState);
    }
    setDraggedIssueId(null);
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="grid grid-cols-5 gap-4 min-w-[1100px] h-full items-start">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.state === col.state);
          const config = STATE_CONFIG[col.state];

          return (
            <div
              key={col.state}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.state)}
              className="flex flex-col bg-[#080d18] border border-white/[0.06] rounded-2xl p-3 min-h-[550px] max-h-[calc(100vh-220px)] shadow-inner"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1.5 pb-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.bg} ${config.border} border`} />
                  <span className="text-xs font-bold text-white tracking-tight">
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400">
                    {colIssues.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenCreateModal(col.state)}
                  className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition"
                  title={`Add issue to ${col.label}`}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, issue.id)}
                    className="cursor-grab active:cursor-grabbing transition-transform active:scale-[0.98]"
                  >
                    <IssueCard
                      issue={issue}
                      projectIdentifier={projectIdentifier}
                      onClick={() => onSelectIssue?.(issue)}
                      onStateChange={(s) => onIssueStateChange(issue.id, s)}
                    />
                  </div>
                ))}
                {colIssues.length === 0 && (
                  <div className="h-28 border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center text-[11px] text-slate-600">
                    No issues
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
