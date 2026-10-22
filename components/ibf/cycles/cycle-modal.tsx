"use client";

import React, { useState, useEffect } from "react";
import { Cycle } from "@/components/pm/cycles/cycles-view";
import { X, Loader2, Trash2 } from "lucide-react";

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  cycle?: Cycle | null;
  onCycleSaved: (cycle: Cycle) => void;
  onCycleDeleted?: (cycleId: string) => void;
}

export function CycleModal({
  isOpen,
  onClose,
  projectId,
  cycle = null,
  onCycleSaved,
  onCycleDeleted,
}: CycleModalProps) {
  const isEditing = Boolean(cycle);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"planned" | "active" | "completed">("planned");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cycle) {
      setName(cycle.name || "");
      setDescription(cycle.description || "");
      setStartDate(cycle.start_date || "");
      setEndDate(cycle.end_date || "");
      setStatus(cycle.status || "planned");
    } else {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus("planned");
    }
    setError("");
  }, [cycle, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      };

      if (isEditing && cycle) {
        const res = await fetch(`/api/projects/${projectId}/cycles/${cycle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update sprint");

        onCycleSaved(data);
      } else {
        const res = await fetch(`/api/projects/${projectId}/cycles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create sprint");

        onCycleSaved(data);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save sprint");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!cycle) return;
    if (!window.confirm("Are you sure you want to delete this sprint? Linked issues will be moved to Backlog.")) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/cycles/${cycle.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete sprint");
      }

      onCycleDeleted?.(cycle.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete sprint");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e1626] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X size={18} />
        </button>

        <h2 className="text-base font-bold text-white mb-4">
          {isEditing ? "Edit Sprint Cycle" : "Create New Sprint"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sprint Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 5 · Core Architecture"
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sprint Goal / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key deliverable goals or focus areas..."
              className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Lifecycle Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
            >
              <option value="planned">Draft / Upcoming</option>
              <option value="active">Active (Current Sprint)</option>
              <option value="completed">Completed (Archived)</option>
            </select>
            {status === "active" && (
              <p className="text-[11px] text-amber-400 mt-1">
                Setting this sprint to Active will demote any other active sprint in this project.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}

          <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-white/[0.06]">
            {isEditing ? (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete Sprint
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
                disabled={loading || !name.trim()}
                className="px-4 py-2 text-xs font-bold bg-cyan-300 text-slate-950 hover:bg-cyan-200 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isEditing ? "Save Sprint" : "Create Sprint"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
