"use client";

import React, { useState, useEffect } from "react";
import { Module } from "@/types/database.types";
import { X, Layers, Calendar, Loader2, User, Trash2 } from "lucide-react";

interface Member {
  id: string;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  module?: Module | null;
  onModuleSaved: (module: Module) => void;
  onModuleDeleted?: (moduleId: string) => void;
}

export function ModuleModal({
  isOpen,
  onClose,
  projectId,
  module = null,
  onModuleSaved,
  onModuleDeleted,
}: ModuleModalProps) {
  const isEditing = Boolean(module);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Module["status"]>("planned");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [leadId, setLeadId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (module) {
      setName(module.name || "");
      setDescription(module.description || "");
      setStatus(module.status || "planned");
      setStartDate(module.start_date || "");
      setTargetDate(module.target_date || "");
      setLeadId(module.lead_id || "");
    } else {
      setName("");
      setDescription("");
      setStatus("planned");
      setStartDate("");
      setTargetDate("");
      setLeadId("");
    }
    setError("");
  }, [module, isOpen]);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    fetch(`/api/projects/${projectId}/members`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMembers(data || []))
      .catch(() => {});
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        start_date: startDate || null,
        target_date: targetDate || null,
        lead_id: leadId || null,
      };

      if (isEditing && module) {
        const res = await fetch(`/api/projects/${projectId}/modules/${module.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update module");
        }

        const updated = await res.json();
        onModuleSaved(updated);
      } else {
        const res = await fetch(`/api/projects/${projectId}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create module");
        }

        const created = await res.json();
        onModuleSaved(created);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save module");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!module) return;
    if (!window.confirm("Are you sure you want to delete this feature module? Linked issues will be unlinked.")) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/modules/${module.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete module");
      }

      onModuleDeleted?.(module.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete module");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#090e18] border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-300 grid place-items-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditing ? "Edit Feature Module (Epic)" : "New Feature Module (Epic)"}
              </h2>
              <p className="text-[11px] text-slate-400">
                Track high-level features, roadmap initiatives, and delivery milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Module Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Real-Time Chat Engine, Stripe Billing..."
              required
              autoFocus
              className="px-3.5 py-2.5 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope, architectural context, and goals of this epic..."
              rows={3}
              className="px-3.5 py-2.5 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-400/50 cursor-pointer"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Lead Owner</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-400/50 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.name || m.username || m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/[0.06]">
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
                Delete Module
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition disabled:opacity-40 shadow-sm"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {isEditing ? "Save Module" : "Create Module"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
