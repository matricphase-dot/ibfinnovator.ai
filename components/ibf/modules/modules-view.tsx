"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Module } from "@/types/database.types";
import { ModuleModal } from "./module-modal";
import { ModuleCard } from "./module-card";
import { ModuleDetailDrawer } from "./module-detail-drawer";
import {
  Layers,
  Plus,
  PlayCircle,
  CheckCircle2,
  Clock,
  PauseCircle,
  Loader2,
  Search,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface ModulesViewProps {
  projectId: string;
  projectIdentifier?: string;
  onSelectModule?: (moduleId: string) => void;
  onSelectIssue?: (issueId: string) => void;
}

type FilterStatus = "all" | Module["status"];

export function ModulesView({
  projectId,
  projectIdentifier = "INN",
  onSelectModule,
  onSelectIssue,
}: ModulesViewProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  useEffect(() => {
    if (projectId) loadModules();
  }, [projectId]);

  // Handle open Drawer
  function handleOpenDrawer(moduleId: string) {
    setSelectedModuleId(moduleId);
    setDrawerOpen(true);
    if (onSelectModule) {
      onSelectModule(moduleId);
    }
  }

  // Handle open Create Modal
  function handleOpenCreateModal() {
    setEditingModule(null);
    setModalOpen(true);
  }

  // Handle open Edit Modal
  function handleOpenEditModal(module: Module) {
    setEditingModule(module);
    setModalOpen(true);
  }

  // Handle Save (Create or Update)
  function handleModuleSaved(savedModule: Module) {
    setModules((prev) => {
      const index = prev.findIndex((m) => m.id === savedModule.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...savedModule };
        return next;
      }
      return [savedModule, ...prev];
    });
    setRefreshTrigger((prev) => prev + 1);
    setModalOpen(false);
    setEditingModule(null);
  }

  // Handle Delete
  function handleModuleDeleted(moduleId: string) {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    if (selectedModuleId === moduleId) {
      setDrawerOpen(false);
      setSelectedModuleId(null);
    }
  }

  // Metrics
  const totalCount = modules.length;
  const inProgressCount = modules.filter((m) => m.status === "in_progress").length;
  const completedCount = modules.filter((m) => m.status === "completed").length;

  const overallProgress = useMemo(() => {
    const totalIssues = modules.reduce((sum, m) => sum + (m.issue_count || 0), 0);
    const completedIssues = modules.reduce(
      (sum, m) => sum + (m.completed_issue_count || 0),
      0
    );
    if (totalIssues === 0) return 0;
    return Math.round((completedIssues / totalIssues) * 100);
  }, [modules]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesStatus =
        activeFilter === "all" ? true : m.status === activeFilter;
      const matchesSearch =
        searchQuery.trim() === ""
          ? true
          : m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [modules, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          onClick={handleOpenCreateModal}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <Plus size={15} />
          New Module
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 grid place-items-center">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Total Epics</div>
            <div className="text-lg font-bold text-white font-mono">{totalCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-400/10 text-sky-400 grid place-items-center">
            <PlayCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">In Progress</div>
            <div className="text-lg font-bold text-sky-400 font-mono">{inProgressCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 grid place-items-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Completed</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{completedCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-400/10 text-cyan-300 grid place-items-center">
            <BarChart3 size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Roadmap Velocity</div>
            <div className="text-lg font-bold text-cyan-300 font-mono">{overallProgress}%</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#090e18] rounded-xl border border-white/[0.08] overflow-x-auto">
          {(
            [
              { id: "all", label: "All" },
              { id: "in_progress", label: "In Progress" },
              { id: "planned", label: "Planned" },
              { id: "completed", label: "Completed" },
              { id: "paused", label: "Paused" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-white/10 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search epics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#090e18] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={16} className="animate-spin text-cyan-400" />
          Loading feature modules…
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
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition"
          >
            <Plus size={14} />
            Create First Module
          </button>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-[#090e18]/50 rounded-xl border border-white/[0.04]">
          No feature modules match your search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              onClick={() => handleOpenDrawer(m.id)}
              onEdit={() => handleOpenEditModal(m)}
            />
          ))}
        </div>
      )}

      {/* Module Creator / Editor Modal */}
      <ModuleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingModule(null);
        }}
        projectId={projectId}
        module={editingModule}
        onModuleSaved={handleModuleSaved}
        onModuleDeleted={handleModuleDeleted}
      />

      {/* 720px Side-Peek Module Detail Drawer */}
      <ModuleDetailDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedModuleId(null);
        }}
        moduleId={selectedModuleId}
        projectId={projectId}
        projectIdentifier={projectIdentifier}
        onEditModule={(mod) => {
          setEditingModule(mod);
          setModalOpen(true);
        }}
        onModuleDeleted={handleModuleDeleted}
        onSelectIssue={onSelectIssue}
        onModuleChanged={loadModules}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
