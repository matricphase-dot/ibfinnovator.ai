"use client";

import React, { useState } from "react";
import { CheckSquare, Plus, CheckCircle2, Circle, Loader2 } from "lucide-react";

interface Subtask {
  id: string;
  sequence_id: number;
  title: string;
  state: string;
}

interface IssueSubtasksProps {
  parentIssueId: string;
  projectId: string;
  projectIdentifier?: string;
  initialSubtasks?: Subtask[];
  onSubtaskCreated?: (subtask: Subtask) => void;
  onSubtaskToggled?: (subtaskId: string, newState: string) => void;
}

export function IssueSubtasks({
  parentIssueId,
  projectId,
  projectIdentifier = "INN",
  initialSubtasks = [],
  onSubtaskCreated,
  onSubtaskToggled,
}: IssueSubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const completedCount = subtasks.filter((s) => s.state === "done").length;
  const progressPercent =
    subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  async function handleToggle(subtask: Subtask) {
    const newState = subtask.state === "done" ? "todo" : "done";
    const previous = [...subtasks];

    // Optimistic UI
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtask.id ? { ...s, state: newState } : s))
    );
    if (onSubtaskToggled) onSubtaskToggled(subtask.id, newState);

    try {
      const res = await fetch(`/api/issues/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
    } catch {
      setSubtasks(previous);
    }
  }

  async function handleCreateSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          state: "todo",
          parent_issue_id: parentIssueId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create subtask");
      const created = await res.json();
      setSubtasks((prev) => [...prev, created]);
      if (onSubtaskCreated) onSubtaskCreated(created);
      setNewTitle("");
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <CheckSquare size={14} className="text-cyan-400" />
          <span>
            Subtasks ({completedCount}/{subtasks.length})
          </span>
        </div>
        {subtasks.length > 0 && (
          <span className="font-mono text-[11px] text-cyan-300 font-semibold">
            {progressPercent}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {subtasks.map((task) => {
          const isDone = task.state === "done";
          return (
            <div
              key={task.id}
              onClick={() => handleToggle(task)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0a0f1d] hover:bg-[#0f172a] border border-white/[0.05] hover:border-white/10 transition cursor-pointer group"
            >
              <button
                type="button"
                className="text-slate-500 group-hover:text-cyan-400 transition"
              >
                {isDone ? (
                  <CheckCircle2 size={15} className="text-emerald-400" />
                ) : (
                  <Circle size={15} />
                )}
              </button>
              <span className="font-mono text-[10px] text-slate-500">
                {projectIdentifier}-{task.sequence_id}
              </span>
              <span
                className={`text-xs flex-1 transition ${
                  isDone ? "line-through text-slate-500" : "text-slate-200"
                }`}
              >
                {task.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Inline Creator */}
      {isAdding ? (
        <form onSubmit={handleCreateSubtask} className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title... (Press Enter)"
            autoFocus
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-cyan-400/50 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || loading}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200 transition"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewTitle("");
            }}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 font-medium py-1 px-2 rounded-md hover:bg-white/5 transition w-fit"
        >
          <Plus size={13} />
          Add subtask
        </button>
      )}
    </div>
  );
}
