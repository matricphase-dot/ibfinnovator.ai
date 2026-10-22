"use client";

import React, { useState } from "react";
import { Cycle } from "@/components/pm/cycles/cycles-view";
import { X, CheckCircle2, AlertCircle, ArrowRight, Loader2, Flag } from "lucide-react";

interface CycleCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: Cycle;
  upcomingCycles: Cycle[];
  projectId: string;
  onSprintCompleted: (completedCycle: Cycle) => void;
}

export function CycleCompleteModal({
  isOpen,
  onClose,
  cycle,
  upcomingCycles,
  projectId,
  onSprintCompleted,
}: CycleCompleteModalProps) {
  const issues = cycle.issues || [];
  const completedIssues = issues.filter((i) => i.state === "done");
  const incompleteIssues = issues.filter((i) => i.state !== "done" && i.state !== "canceled");

  const [incompleteAction, setIncompleteAction] = useState<"next" | "backlog">(
    upcomingCycles.length > 0 ? "next" : "backlog"
  );
  const [selectedNextCycleId, setSelectedNextCycleId] = useState<string>(
    upcomingCycles[0]?.id || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleCompleteSprint(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resolvedAction =
        incompleteAction === "next" && !selectedNextCycleId ? "backlog" : incompleteAction;

      const payload: any = {
        status: "completed",
        incomplete_action: resolvedAction,
      };

      if (resolvedAction === "next" && selectedNextCycleId) {
        payload.next_cycle_id = selectedNextCycleId;
      }

      const res = await fetch(`/api/projects/${projectId}/cycles/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete sprint");

      onSprintCompleted(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete sprint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 text-slate-100">
      <div className="w-full max-w-md bg-[#0e1626] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 grid place-items-center border border-emerald-400/20 font-bold text-xs">
            <Flag size={16} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">Complete Sprint</h2>
            <p className="text-xs text-slate-400">{cycle.name}</p>
          </div>
        </div>

        <form onSubmit={handleCompleteSprint} className="space-y-4 pt-1">
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#080d18] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={14} /> Completed Issues
              </span>
              <span className="font-mono font-bold text-white">
                {completedIssues.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertCircle size={14} /> Incomplete Issues
              </span>
              <span className="font-mono font-bold text-white">
                {incompleteIssues.length}
              </span>
            </div>
          </div>

          {/* Action for incomplete issues */}
          {incompleteIssues.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Unfinished Issues Action ({incompleteIssues.length} issues)
              </label>

              <div className="space-y-2 text-xs">
                {upcomingCycles.length > 0 && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#080d18] border border-white/[0.06] cursor-pointer hover:border-cyan-400/30 transition">
                    <input
                      type="radio"
                      name="incompleteAction"
                      value="next"
                      checked={incompleteAction === "next"}
                      onChange={() => setIncompleteAction("next")}
                      className="mt-0.5 text-cyan-400 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-white block">
                        Move to an upcoming sprint
                      </span>
                      {incompleteAction === "next" && (
                        <select
                          value={selectedNextCycleId}
                          onChange={(e) => setSelectedNextCycleId(e.target.value)}
                          className="mt-2 w-full px-2.5 py-1.5 bg-[#0e1626] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
                        >
                          {upcomingCycles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>
                )}

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#080d18] border border-white/[0.06] cursor-pointer hover:border-cyan-400/30 transition">
                  <input
                    type="radio"
                    name="incompleteAction"
                    value="backlog"
                    checked={incompleteAction === "backlog"}
                    onChange={() => setIncompleteAction("backlog")}
                    className="mt-0.5 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Return to Project Backlog
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Detach issues from any sprint until future planning.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Confirm & Complete Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
