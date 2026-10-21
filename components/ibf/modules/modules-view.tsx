"use client";

import React, { useState, useEffect } from "react";
import { Module } from "@/types/database.types";
import { ModuleModal } from "./module-modal";
import {
  Layers,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface ModulesViewProps {
  projectId: string;
  onSelectModule?: (moduleId: string) => void;
}

export function ModulesView({ projectId, onSelectModule }: ModulesViewProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadModules() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/modules`);
        if (!res.ok) throw new Error("Failed to load modules");
        const data = await res.json();
        setModules(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) loadModules();
  }, [projectId]);

  function getStatusBadge(status: Module["status"]) {
    switch (status) {
      case "in_progress":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            <PlayCircle size={12} /> In Progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "paused":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-md border border-purple-400/20">
            <PauseCircle size={12} /> Paused
          </span>
        );
      case "canceled":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20">
            <XCircle size={12} /> Canceled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            <Clock size={12} /> Planned
          </span>
        );
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            Feature Modules (Epics)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Group related issues into strategic roadmap initiatives and track milestone delivery.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <Plus size={15} />
          New Module
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={16} className="animate-spin text-cyan-400" />
          Loading feature modules...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      ) : modules.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-2xl bg-[#090e18] border border-white/[0.08] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 text-cyan-300 grid place-items-center">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No feature modules yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Organize your backlog into high-level Epics like &quot;Authentication&quot;, &quot;Payment Gateway&quot;, or &quot;AI Engine&quot;.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition"
          >
            <Plus size={14} />
            Create First Module
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const total = m.issue_count || 0;
            const completed = m.completed_issue_count || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={m.id}
                onClick={() => onSelectModule && onSelectModule(m.id)}
                className="p-5 rounded-2xl bg-[#0a0f1d] hover:bg-[#0d1424] border border-white/[0.08] hover:border-cyan-400/30 transition flex flex-col gap-4 group cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                    {m.name}
                  </h3>
                  {getStatusBadge(m.status)}
                </div>

                {m.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {completed} of {total} Issues Done
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer metadata */}
                {m.target_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Calendar size={12} className="text-slate-400" />
                    Target: {new Date(m.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module Creator Modal */}
      <ModuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        onModuleCreated={(newMod) => setModules((prev) => [newMod, ...prev])}
      />
    </div>
  );
}
