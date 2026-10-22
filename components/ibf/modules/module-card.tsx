"use client";

import React from "react";
import { Module } from "@/types/database.types";
import {
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
  User,
  ArrowRight,
  Layers,
} from "lucide-react";

interface ModuleCardProps {
  module: Module;
  onClick?: () => void;
  onEdit?: () => void;
}

export function ModuleCard({ module, onClick, onEdit }: ModuleCardProps) {
  const totalIssues = module.issue_count || 0;
  const completedIssues = module.completed_issue_count || 0;
  const progressPercent =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const leadName =
    module.lead?.full_name || module.lead?.name || "Unassigned";

  function getStatusBadge(status: Module["status"]) {
    switch (status) {
      case "in_progress":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md border border-sky-400/20 uppercase font-mono">
            <PlayCircle size={11} /> In Progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 uppercase font-mono">
            <CheckCircle2 size={11} /> Completed
          </span>
        );
      case "paused":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 uppercase font-mono">
            <PauseCircle size={11} /> Paused
          </span>
        );
      case "canceled":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20 uppercase font-mono">
            <XCircle size={11} /> Canceled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 uppercase font-mono">
            <Clock size={11} /> Planned
          </span>
        );
    }
  }

  const targetDateStr = module.target_date
    ? new Date(module.target_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      onClick={onClick}
      className="p-5 bg-[#080d18] border border-white/[0.06] hover:border-cyan-400/40 rounded-2xl transition cursor-pointer select-none group flex flex-col justify-between shadow-sm hover:shadow-cyan-950/20 hover:shadow-md"
    >
      <div>
        {/* Header: Status + Edit */}
        <div className="flex items-center justify-between mb-2.5">
          {getStatusBadge(module.status)}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Edit
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition leading-snug line-clamp-1 mb-1.5">
          {module.name}
        </h3>

        {/* Description */}
        {module.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {module.description}
          </p>
        ) : (
          <div className="h-4 mb-2" />
        )}
      </div>

      <div className="pt-3 border-t border-white/[0.04] space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-400 font-medium">
              {completedIssues} of {totalIssues} Issues Completed
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100 ? "bg-emerald-400" : "bg-cyan-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer: Lead Owner + Target Date */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          {/* Lead Avatar */}
          <div className="flex items-center gap-1.5" title={`Lead: ${leadName}`}>
            {module.lead?.avatar_url ? (
              <img
                src={module.lead.avatar_url}
                alt={leadName}
                className="w-5 h-5 rounded-full object-cover border border-white/10"
              />
            ) : module.lead ? (
              <div className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-300 grid place-items-center text-[10px] font-bold">
                {leadName.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                <User size={12} /> Unassigned Lead
              </span>
            )}
            {module.lead && (
              <span className="text-[11px] text-slate-300 truncate max-w-[100px]">
                {leadName}
              </span>
            )}
          </div>

          {/* Target Date */}
          {targetDateStr && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Calendar size={11} />
              <span>{targetDateStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
