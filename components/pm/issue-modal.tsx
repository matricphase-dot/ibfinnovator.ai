"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { PrioritySelect, Priority } from "./priority-select";
import { StateSelect, IssueState } from "./state-select";
import { Issue } from "./issue-card";
import { Cycle } from "./cycles/cycles-view";

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  issue?: Issue | null;
  cycles?: Cycle[];
  defaultState?: IssueState;
  onIssueCreated?: (issue: Issue) => void;
  onIssueUpdated?: (issue: Issue) => void;
  onIssueDeleted?: (issueId: string) => void;
}

export function IssueModal({
  isOpen,
  onClose,
  projectId,
  issue = null,
  cycles = [],
  defaultState = "todo",
  onIssueCreated,
  onIssueUpdated,
  onIssueDeleted,
}: IssueModalProps) {
  const isEditing = Boolean(issue);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [state, setState] = useState<IssueState>(defaultState);
  const [cycleId, setCycleId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setPriority(issue.priority || "none");
      setState(issue.state || defaultState);
      setDueDate(issue.due_date || "");
      setCycleId((issue as any).cycle_id || "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("none");
      setState(defaultState);
      setDueDate("");
      setCycleId("");
    }
    setError("");
  }, [issue, isOpen, defaultState]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        state,
        cycle_id: cycleId ? cycleId : null,
        due_date: dueDate || null,
      };

      if (isEditing && issue) {
        const res = await fetch(`/api/issues/${issue.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update issue");

        onIssueUpdated?.(data);
      } else {
        const res = await fetch(`/api/projects/${projectId}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create issue");

        onIssueCreated?.(data);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save issue");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!issue) return;
    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete issue");
      }

      onIssueDeleted?.(issue.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete issue");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e1626] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-white">
            {isEditing ? "Edit Issue" : "Create New Issue"}
          </h2>
          {isEditing && issue && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-300/10 text-cyan-300 border border-cyan-300/20 font-bold">
              {issue.project_identifier || "INN"}-{issue.sequence_id}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              autoFocus
              placeholder="Issue title (e.g. Implement GitHub OAuth)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition"
            />
          </div>

          <div>
            <textarea
              rows={4}
              placeholder="Description (markdown supported)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition resize-none"
            />
          </div>

          {/* Properties Bar: State, Priority, Sprint Cycle, Due Date */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
            <div>
              <StateSelect value={state} onChange={setState} />
            </div>
            <div>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>

            {/* Cycle Selector */}
            {cycles.length > 0 && (
              <div>
                <select
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  className="appearance-none px-3 py-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-xs font-medium text-slate-200 hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
                >
                  <option value="">No Sprint</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      Sprint: {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2.5 py-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-white/[0.06]">
            {isEditing ? (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-4 py-2 text-xs font-bold bg-cyan-300 text-slate-950 hover:bg-cyan-200 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isEditing ? "Save Changes" : "Create Issue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
