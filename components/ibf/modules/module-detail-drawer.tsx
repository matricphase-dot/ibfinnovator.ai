"use client";

import React, { useState, useEffect } from "react";
import { Module } from "@/types/database.types";
import {
  Layers,
  X,
  Edit3,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
  Plus,
  Loader2,
  Search,
  ExternalLink,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import { StateSelect, IssueState } from "@/components/pm/state-select";
import { PrioritySelect, Priority } from "@/components/pm/priority-select";

interface ModuleIssue {
  id: string;
  sequence_id: number;
  title: string;
  state: IssueState;
  priority: Priority;
  due_date?: string | null;
  assignee?: {
    id: string;
    name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface ModuleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string | null;
  projectId: string;
  projectIdentifier?: string;
  onEditModule: (module: Module) => void;
  onModuleDeleted: (moduleId: string) => void;
  onSelectIssue?: (issueId: string) => void;
  onModuleChanged?: () => void;
  refreshTrigger?: number;
}

export function ModuleDetailDrawer({
  isOpen,
  onClose,
  moduleId,
  projectId,
  projectIdentifier = "INN",
  onEditModule,
  onModuleDeleted,
  onSelectIssue,
  onModuleChanged,
  refreshTrigger = 0,
}: ModuleDetailDrawerProps) {
  const [moduleData, setModuleData] = useState<(Module & { issues?: ModuleIssue[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Link issue picker state
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [availableIssues, setAvailableIssues] = useState<ModuleIssue[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch module detail and linked issues
  useEffect(() => {
    if (!isOpen || !moduleId) {
      setModuleData(null);
      setShowAddPicker(false);
      return;
    }

    async function fetchModuleDetail() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/projects/${projectId}/modules/${moduleId}`);
        if (!res.ok) throw new Error("Failed to load module details");
        const data = await res.json();
        setModuleData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load module");
      } finally {
        setLoading(false);
      }
    }

    fetchModuleDetail();
  }, [isOpen, moduleId, projectId, refreshTrigger]);

  // Load available project issues not yet in this module
  async function loadAvailableIssues() {
    setLoadingAvailable(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`);
      if (res.ok) {
        const allIssues: any[] = await res.json();
        const unlinked = allIssues.filter((i) => i.module_id !== moduleId);
        setAvailableIssues(unlinked);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAvailable(false);
    }
  }

  function handleOpenAddPicker() {
    setShowAddPicker(true);
    loadAvailableIssues();
  }

  // Link an issue
  async function handleLinkIssue(issueId: string) {
    if (!moduleId) return;
    setActionLoadingId(issueId);
    try {
      const res = await fetch(`/api/modules/${moduleId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_ids: [issueId],
          action: "add",
        }),
      });

      if (!res.ok) throw new Error("Failed to link issue");

      // Update local state
      const target = availableIssues.find((i) => i.id === issueId);
      if (target && moduleData) {
        const updatedIssues = [target, ...(moduleData.issues || [])];
        const completed = updatedIssues.filter((i) => i.state === "done").length;
        setModuleData({
          ...moduleData,
          issues: updatedIssues,
          issue_count: updatedIssues.length,
          completed_issue_count: completed,
        });
        setAvailableIssues((prev) => prev.filter((i) => i.id !== issueId));
      }
      onModuleChanged?.();
    } catch (err: any) {
      alert(err.message || "Could not link issue");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Unlink an issue
  async function handleUnlinkIssue(issueId: string) {
    if (!moduleId) return;
    setActionLoadingId(issueId);
    try {
      const res = await fetch(`/api/modules/${moduleId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_ids: [issueId],
          action: "remove",
        }),
      });

      if (!res.ok) throw new Error("Failed to unlink issue");

      if (moduleData) {
        const target = moduleData.issues?.find((i) => i.id === issueId);
        const updatedIssues = (moduleData.issues || []).filter((i) => i.id !== issueId);
        const completed = updatedIssues.filter((i) => i.state === "done").length;
        setModuleData({
          ...moduleData,
          issues: updatedIssues,
          issue_count: updatedIssues.length,
          completed_issue_count: completed,
        });
        if (target) {
          setAvailableIssues((prev) => [target, ...prev]);
        }
      }
      onModuleChanged?.();
    } catch (err: any) {
      alert(err.message || "Could not unlink issue");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Delete module
  async function handleDeleteModule() {
    if (!moduleId) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this feature module? Linked issues will be preserved and unlinked."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete module");
      onModuleDeleted(moduleId);
      onClose();
    } catch (err: any) {
      alert(err.message || "Could not delete module");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen) return null;

  const totalIssues = moduleData?.issue_count || (moduleData?.issues || []).length || 0;
  const completedIssues =
    moduleData?.completed_issue_count ||
    (moduleData?.issues || []).filter((i) => i.state === "done").length ||
    0;
  const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const leadName =
    moduleData?.lead?.full_name || moduleData?.lead?.name || "Unassigned Lead";

  function getStatusBadge(status?: Module["status"]) {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md border border-sky-400/20 font-mono">
            <PlayCircle size={12} /> In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 font-mono">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 font-mono">
            <PauseCircle size={12} /> Paused
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20 font-mono">
            <XCircle size={12} /> Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 font-mono">
            <Clock size={12} /> Planned
          </span>
        );
    }
  }

  const filteredAvailable = availableIssues.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${projectIdentifier}-${i.sequence_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#080d18] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0b1220]/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-400/10 text-cyan-300 grid place-items-center">
              <Layers size={16} />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
              Feature Epic Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            {moduleData && (
              <>
                <button
                  onClick={() => onEditModule(moduleData)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                  title="Edit Module Details"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={handleDeleteModule}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete Module"
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin text-rose-400" /> : <Trash2 size={15} />}
                </button>
              </>
            )}
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              title="Close drawer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 size={18} className="animate-spin text-cyan-300" />
            Loading module details…
          </div>
        ) : error ? (
          <div className="m-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : !moduleData ? null : (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Title & Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(moduleData.status)}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                {moduleData.name}
              </h2>
              {moduleData.description && (
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {moduleData.description}
                </p>
              )}
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {/* Lead */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                  {moduleData.lead?.avatar_url ? (
                    <img
                      src={moduleData.lead.avatar_url}
                      alt={leadName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-cyan-300">
                      {leadName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Lead Owner</div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{leadName}</div>
                </div>
              </div>

              {/* Target Date */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-slate-400">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Target Date</div>
                  <div className="text-xs font-semibold font-mono text-slate-200">
                    {moduleData.target_date
                      ? new Date(moduleData.target_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No target set"}
                  </div>
                </div>
              </div>
            </div>

            {/* Scope & Progress */}
            <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Progress: {completedIssues} of {totalIssues} Issues Completed
                </span>
                <span className="font-mono font-bold text-cyan-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? "bg-emerald-400" : "bg-cyan-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Linked Issues Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  Linked Issues ({moduleData.issues?.length || 0})
                </h3>
                <button
                  onClick={handleOpenAddPicker}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
                >
                  <Plus size={14} /> Link Issue
                </button>
              </div>

              {/* Add Issue Inline Picker Drawer Tray */}
              {showAddPicker && (
                <div className="p-4 rounded-xl bg-[#0d1627] border border-cyan-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Select Issues to Link</span>
                    <button
                      onClick={() => setShowAddPicker(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search unlinked issues by key or title…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#080d18] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  {loadingAvailable ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-cyan-300" />
                      Loading backlog issues…
                    </div>
                  ) : filteredAvailable.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No other project issues found.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredAvailable.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs transition"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              {projectIdentifier}-{issue.sequence_id}
                            </span>
                            <span className="text-slate-200 truncate">{issue.title}</span>
                          </div>
                          <button
                            onClick={() => handleLinkIssue(issue.id)}
                            disabled={actionLoadingId === issue.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 font-bold text-[11px] shrink-0 transition"
                          >
                            {actionLoadingId === issue.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Plus size={12} />
                            )}
                            Link
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Linked Issues List */}
              {(!moduleData.issues || moduleData.issues.length === 0) ? (
                <div className="py-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10 text-xs text-slate-500">
                  No issues linked to this module yet. Click &quot;Link Issue&quot; above to connect roadmap items.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {moduleData.issues.map((issue) => {
                    const isDone = issue.state === "done";
                    return (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a0f1d] hover:bg-[#0c1426] border border-white/[0.06] hover:border-cyan-500/20 transition group"
                      >
                        <div
                          onClick={() => onSelectIssue?.(issue.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          {/* Done Check Icon */}
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                              isDone
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : "border-slate-600 group-hover:border-slate-400 text-transparent"
                            }`}
                          >
                            <CheckCircle2 size={12} />
                          </div>

                          {/* Identifier */}
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                            {projectIdentifier}-{issue.sequence_id}
                          </span>

                          {/* Title */}
                          <span
                            className={`text-xs truncate ${
                              isDone ? "text-slate-500 line-through" : "text-slate-200"
                            }`}
                          >
                            {issue.title}
                          </span>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-2 pl-3 shrink-0">
                          {/* State badge */}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold uppercase ${
                              isDone
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : issue.state === "in_progress"
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                : "bg-white/5 text-slate-400 border border-white/10"
                            }`}
                          >
                            {issue.state.replace("_", " ")}
                          </span>

                          {/* Unlink Action */}
                          <button
                            onClick={() => handleUnlinkIssue(issue.id)}
                            disabled={actionLoadingId === issue.id}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Unlink from Module"
                          >
                            {actionLoadingId === issue.id ? (
                              <Loader2 size={13} className="animate-spin text-rose-400" />
                            ) : (
                              <MinusCircle size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
