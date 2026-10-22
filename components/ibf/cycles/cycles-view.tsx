"use client";

import React, { useState, useMemo } from "react";
import { ActiveCycleCard } from "./active-cycle-card";
import { CycleModal } from "./cycle-modal";
import { CycleBacklogTray } from "./cycle-backlog-tray";
import { CycleCompleteModal } from "./cycle-complete-modal";
import {
  RotateCw,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  Flag,
  ArrowRight,
  Layers,
} from "lucide-react";

export interface Cycle {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "planned" | "active" | "completed";
  issues?: {
    id: string;
    sequence_id?: number;
    title?: string;
    state: string;
    priority: string;
    estimate_points?: number | null;
  }[];
}

interface CyclesViewProps {
  cycles: Cycle[];
  projectId: string;
  projectIdentifier?: string;
  onCycleCreated?: (cycle: Cycle) => void;
  onCycleUpdated?: (cycle: Cycle) => void;
  onRefresh?: () => void;
}

export function CyclesView({
  cycles: initialCycles,
  projectId,
  projectIdentifier = "INN",
  onCycleCreated,
  onCycleUpdated,
  onRefresh,
}: CyclesViewProps) {
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planned" | "completed">("all");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [backlogTrayOpen, setBacklogTrayOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [targetCompleteCycle, setTargetCompleteCycle] = useState<Cycle | null>(null);

  // Sync state if initialCycles changes
  React.useEffect(() => {
    setCycles(initialCycles);
  }, [initialCycles]);

  const activeCycle = useMemo(
    () => cycles.find((c) => c.status === "active"),
    [cycles]
  );

  const upcomingCycles = useMemo(
    () => cycles.filter((c) => c.status === "planned"),
    [cycles]
  );

  const completedCycles = useMemo(
    () => cycles.filter((c) => c.status === "completed"),
    [cycles]
  );

  function handleCycleSaved(saved: Cycle) {
    setCycles((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      let nextList = exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev];

      // If saved cycle is active, demote other active cycles locally
      if (saved.status === "active") {
        nextList = nextList.map((c) =>
          c.id !== saved.id && c.status === "active" ? { ...c, status: "planned" } : c
        );
      }
      return nextList;
    });

    onCycleUpdated?.(saved);
    onCycleCreated?.(saved);
    onRefresh?.();
  }

  function handleCycleDeleted(cycleId: string) {
    setCycles((prev) => prev.filter((c) => c.id !== cycleId));
    onRefresh?.();
  }

  async function handleStartCycle(cycleId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!res.ok) throw new Error("Failed to activate sprint");
      const updated = await res.json();
      handleCycleSaved(updated);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RotateCw size={18} className="text-cyan-400" />
            Sprints & Deliverable Cycles
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Iterative scope planning with automated velocity tracking, live countdowns, and backlog rollovers.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCycle(null);
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-200 transition shadow-sm"
        >
          <Plus size={15} />
          Create Sprint
        </button>
      </div>

      {/* ACTIVE CYCLE HERO BANNER */}
      {activeCycle ? (
        <ActiveCycleCard
          cycle={activeCycle}
          onOpenBacklogTray={() => setBacklogTrayOpen(true)}
          onCompleteSprint={() => {
            setTargetCompleteCycle(activeCycle);
            setCompleteModalOpen(true);
          }}
          onEditCycle={() => {
            setEditingCycle(activeCycle);
            setCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="p-8 bg-[#080d18] border border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 grid place-items-center">
            <PlayCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Sprint Currently Active</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Activate an upcoming sprint or create a new cycle to begin tracking team velocity and burn rate.
            </p>
          </div>
          {upcomingCycles.length > 0 && (
            <button
              onClick={() => handleStartCycle(upcomingCycles[0].id)}
              className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-200 transition shadow-sm"
            >
              Start {upcomingCycles[0].name}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Tabs Filter: All / Upcoming / Completed */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "all"
              ? "bg-white/10 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All Sprints ({cycles.length})
        </button>
        <button
          onClick={() => setActiveTab("planned")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "planned"
              ? "bg-white/10 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Upcoming ({upcomingCycles.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "completed"
              ? "bg-white/10 text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Completed ({completedCycles.length})
        </button>
      </div>

      {/* Sprint Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles
          .filter((c) => {
            if (activeTab === "all") return true;
            if (activeTab === "planned") return c.status === "planned";
            if (activeTab === "completed") return c.status === "completed";
            return true;
          })
          .map((cycle) => {
            const issues = cycle.issues || [];
            const totalIssues = issues.length;
            const completedIssues = issues.filter((i) => i.state === "done").length;
            const percent =
              totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

            const isCurrentActive = cycle.status === "active";

            return (
              <div
                key={cycle.id}
                className={`p-5 bg-[#080d18] border rounded-2xl transition flex flex-col justify-between shadow-sm hover:border-cyan-400/40 ${
                  isCurrentActive
                    ? "border-cyan-400/30 ring-1 ring-cyan-400/20"
                    : "border-white/[0.06]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono border ${
                        cycle.status === "active"
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                          : cycle.status === "completed"
                          ? "bg-white/5 text-slate-400 border-white/10"
                          : "bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
                      }`}
                    >
                      {cycle.status}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCycle(cycle);
                        setCreateModalOpen(true);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                    >
                      Settings
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{cycle.name}</h4>
                  {cycle.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {cycle.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.04] space-y-3">
                  {/* Date Range */}
                  {(cycle.start_date || cycle.end_date) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Calendar size={12} className="text-slate-500" />
                      <span>
                        {cycle.start_date || "Start"} – {cycle.end_date || "End"}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">
                        {completedIssues} / {totalIssues} Issues Done
                      </span>
                      <span className="font-mono font-bold text-cyan-300">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Start or Actions */}
                  {cycle.status === "planned" && (
                    <button
                      onClick={() => handleStartCycle(cycle.id)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 transition flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle size={13} />
                      Start Sprint
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Modals & Drawers */}
      <CycleModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingCycle(null);
        }}
        projectId={projectId}
        cycle={editingCycle}
        onCycleSaved={handleCycleSaved}
        onCycleDeleted={handleCycleDeleted}
      />

      {activeCycle && (
        <CycleBacklogTray
          isOpen={backlogTrayOpen}
          onClose={() => setBacklogTrayOpen(false)}
          cycle={activeCycle}
          projectId={projectId}
          projectIdentifier={projectIdentifier}
          onIssuesUpdated={() => {
            onRefresh?.();
          }}
        />
      )}

      {targetCompleteCycle && (
        <CycleCompleteModal
          isOpen={completeModalOpen}
          onClose={() => {
            setCompleteModalOpen(false);
            setTargetCompleteCycle(null);
          }}
          cycle={targetCompleteCycle}
          upcomingCycles={upcomingCycles.filter((c) => c.id !== targetCompleteCycle.id)}
          projectId={projectId}
          onSprintCompleted={(completed) => {
            handleCycleSaved(completed);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
