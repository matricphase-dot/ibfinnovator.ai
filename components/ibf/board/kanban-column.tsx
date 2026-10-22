"use client";

import React, { useState, useRef, useEffect } from "react";
import { IssueCard, Issue } from "./issue-card";
import { IssueState, STATE_CONFIG } from "@/components/pm/state-select";
import { Plus, X, Loader2 } from "lucide-react";

interface KanbanColumnProps {
  state: IssueState;
  label: string;
  issues: Issue[];
  projectIdentifier?: string;
  onSelectIssue?: (issue: Issue) => void;
  onIssueStateChange: (issueId: string, newState: IssueState) => void;
  onInlineCreate?: (title: string, state: IssueState) => Promise<void> | void;
  onOpenCreateModal?: (defaultState: IssueState) => void;
}

export function KanbanColumn({
  state,
  label,
  issues,
  projectIdentifier = "INN",
  onSelectIssue,
  onIssueStateChange,
  onInlineCreate,
  onOpenCreateModal,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInlineOpen, setIsInlineOpen] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = STATE_CONFIG[state];

  useEffect(() => {
    if (isInlineOpen) {
      inputRef.current?.focus();
    }
  }, [isInlineOpen]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const issueId = e.dataTransfer.getData("text/plain");
    if (issueId) {
      onIssueStateChange(issueId, state);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleInlineSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inlineTitle.trim();
    if (!trimmed || inlineSubmitting) return;

    setInlineSubmitting(true);
    try {
      if (onInlineCreate) {
        await onInlineCreate(trimmed, state);
      }
      setInlineTitle("");
      // Keep input open for rapid-fire creation
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to inline create issue", err);
    } finally {
      setInlineSubmitting(false);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/70 border rounded-2xl p-3 min-h-[550px] max-h-[calc(100vh-210px)] shadow-xs transition-colors duration-200 ${
        isDragOver
          ? "border-cyan-400 bg-cyan-50/60"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.bg} ${config.border} border`} />
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            {label}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/80 font-semibold shadow-2xs">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsInlineOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-slate-200/60 rounded-lg transition"
            title={`Quick add issue to ${label}`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {issues.map((issue) => (
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

        {issues.length === 0 && !isInlineOpen && (
          <div className="h-28 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-[11px] text-slate-400 gap-1.5 select-none bg-white/40">
            <span>No issues in {label}</span>
            <button
              type="button"
              onClick={() => setIsInlineOpen(true)}
              className="text-[10px] font-semibold text-cyan-600 hover:text-cyan-700 underline underline-offset-2"
            >
              + Create issue
            </button>
          </div>
        )}
      </div>

      {/* Column Footer: Rapid-Fire Inline Creator */}
      {isInlineOpen ? (
        <form onSubmit={handleInlineSubmit} className="pt-2.5 mt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 bg-white border border-cyan-400 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-xs">
            <input
              ref={inputRef}
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              placeholder={`Add to ${label}... (Enter)`}
              disabled={inlineSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsInlineOpen(false);
                  setInlineTitle("");
                }
              }}
              className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {inlineSubmitting ? (
              <Loader2 size={13} className="animate-spin text-cyan-600 mx-1" />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsInlineOpen(false);
                  setInlineTitle("");
                }}
                className="p-1 text-slate-400 hover:text-slate-600 transition rounded-md"
                title="Cancel"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-500 font-mono">
            <span>Press Enter to save</span>
            <button
              type="button"
              onClick={() => {
                setIsInlineOpen(false);
                onOpenCreateModal?.(state);
              }}
              className="hover:text-cyan-600 font-medium transition"
            >
              Full modal ↗
            </button>
          </div>
        </form>
      ) : (
        <div className="pt-2 mt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsInlineOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition shadow-2xs"
          >
            <Plus size={13} />
            <span>New Issue</span>
          </button>
        </div>
      )}
    </div>
  );
}
