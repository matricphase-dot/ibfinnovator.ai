"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, Clock, Calendar, Loader2 } from "lucide-react";

export interface Cycle {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "planned" | "active" | "completed";
  issues?: { id: string; state: string; priority: string }[];
}

interface CyclesViewProps {
  cycles: Cycle[];
  projectId: string;
  onCycleCreated?: (cycle: Cycle) => void;
}

export function CyclesView({ cycles, projectId, onCycleCreated }: CyclesViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"planned" | "active" | "completed">("planned");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cycle");

      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus("planned");
      setShowModal(false);
      onCycleCreated?.(data);
    } catch (err: any) {
      setError(err.message || "Failed to create sprint cycle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Sprint Cycles</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize and track iterative deliverables inspired by Plane cycles.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-200 transition"
        >
          <Plus size={15} />
          Create Sprint
        </button>
      </div>

      {/* Grid of Cycles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map((cycle) => {
          const totalIssues = cycle.issues?.length || 0;
          const completedIssues = cycle.issues?.filter((i) => i.state === "done").length || 0;
          const percent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

          return (
            <div
              key={cycle.id}
              className="p-5 bg-[#080d18] border border-white/[0.08] hover:border-cyan-300/30 rounded-2xl transition flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                      cycle.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : cycle.status === "completed"
                        ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    }`}
                  >
                    {cycle.status}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    {cycle.start_date && cycle.end_date ? (
                      <span>
                        {cycle.start_date} → {cycle.end_date}
                      </span>
                    ) : (
                      <span>No dates set</span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white">{cycle.name}</h3>
                {cycle.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cycle.description}</p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {completedIssues} of {totalIssues} issues completed
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300">{percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-300 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {cycles.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl">
            <Clock size={28} className="mx-auto text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-white">No sprint cycles active</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Plan your first sprint cycle to group tasks, track velocity, and monitor burndown milestones.
            </p>
          </div>
        )}
      </div>

      {/* Create Cycle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e1626] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create New Sprint Cycle</h3>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 1 · MVP Core"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sprint Objective</label>
                <textarea
                  rows={2}
                  placeholder="What is the goal of this sprint?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#080d18] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 text-xs font-bold bg-cyan-300 text-slate-950 rounded-xl hover:bg-cyan-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
