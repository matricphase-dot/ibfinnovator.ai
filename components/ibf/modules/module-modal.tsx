"use client";

import React, { useState } from "react";
import { Module } from "@/types/database.types";
import { X, Layers, Calendar, Loader2 } from "lucide-react";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onModuleCreated: (module: Module) => void;
}

export function ModuleModal({
  isOpen,
  onClose,
  projectId,
  onModuleCreated,
}: ModuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed" | "paused" | "canceled">("planned");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          start_date: startDate || null,
          target_date: targetDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create module");
      }

      const created = await res.json();
      onModuleCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create module");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#090e18] border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-300 grid place-items-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">New Feature Module (Epic)</h2>
              <p className="text-[11px] text-slate-400">Track high-level features and delivery milestones</p>
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
              className="px-3.5 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope and goals of this epic..."
              rows={3}
              className="px-3.5 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 resize-none"
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
              <label className="text-[11px] font-semibold text-slate-300">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0d1424] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs transition disabled:opacity-40"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
