"use client";

import React, { useMemo } from "react";
import { Cycle } from "@/components/pm/cycles/cycles-view";
import {
  Clock,
  CheckCircle2,
  Target,
  Plus,
  Flag,
  Calendar,
  AlertTriangle,
  PlayCircle,
  Edit2,
} from "lucide-react";

interface ActiveCycleCardProps {
  cycle: Cycle;
  onOpenBacklogTray: () => void;
  onCompleteSprint: () => void;
  onEditCycle: () => void;
}

export function ActiveCycleCard({
  cycle,
  onOpenBacklogTray,
  onCompleteSprint,
  onEditCycle,
}: ActiveCycleCardProps) {
  const issues = cycle.issues || [];
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.state === "done").length;
  const inProgressIssues = issues.filter((i) => i.state === "in_progress").length;
  const todoIssues = issues.filter(
    (i) => i.state === "todo" || i.state === "backlog"
  ).length;

  const totalPoints = issues.reduce(
    (acc: number, i: any) => acc + (i.estimate_points || 0),
    0
  );
  const completedPoints = issues
    .filter((i: any) => i.state === "done")
    .reduce((acc: number, i: any) => acc + (i.estimate_points || 0), 0);

  const issueCompletionPercent =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
  const inProgressPercent =
    totalIssues > 0 ? Math.round((inProgressIssues / totalIssues) * 100) : 0;
  const todoPercent =
    totalIssues > 0
      ? Math.max(0, 100 - issueCompletionPercent - inProgressPercent)
      : 0;

  const pointsPercent =
    totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Live Countdown Clock
  const countdown = useMemo(() => {
    if (!cycle.end_date) {
      return { text: "No end date set", isUrgent: false, isOverdue: false };
    }

    const now = new Date().getTime();
    const target = cycle.end_date.includes("T")
      ? new Date(cycle.end_date).getTime()
      : new Date(`${cycle.end_date}T23:59:59`).getTime();
    const diff = target - now;

    if (diff <= 0) {
      const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
      return {
        text: `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`,
        isUrgent: true,
        isOverdue: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const isUrgent = days < 2;
    const text =
      days > 0
        ? `${days}d ${hours}h left`
        : `${hours} hours left`;

    return { text, isUrgent, isOverdue: false };
  }, [cycle.end_date]);

  const dateRangeStr = useMemo(() => {
    if (!cycle.start_date && !cycle.end_date) return "Ongoing Sprint";
    const start = cycle.start_date
      ? new Date(cycle.start_date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "Start";
    const end = cycle.end_date
      ? new Date(cycle.end_date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "End";
    return `${start} – ${end}`;
  }, [cycle.start_date, cycle.end_date]);

  return (
    <div className="w-full bg-[#080d18] border border-cyan-400/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-6">
      {/* Background Glow Accent */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Status + Name + Date + Edit */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE SPRINT
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar size={12} className="text-slate-500" />
              {dateRangeStr}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {cycle.name}
          </h3>
          {cycle.description && (
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {cycle.description}
            </p>
          )}
        </div>

        <button
          onClick={onEditCycle}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-semibold"
          title="Edit sprint settings"
        >
          <Edit2 size={13} />
          <span>Edit</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Time Remaining */}
        <div className="p-4 rounded-xl bg-[#0e1626] border border-white/[0.06] flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl grid place-items-center ${
              countdown.isOverdue
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : countdown.isUrgent
                ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
            }`}
          >
            {countdown.isOverdue ? (
              <AlertTriangle size={18} />
            ) : (
              <Clock size={18} />
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Time Remaining
            </div>
            <div
              className={`text-sm font-bold ${
                countdown.isOverdue
                  ? "text-rose-400"
                  : countdown.isUrgent
                  ? "text-amber-400"
                  : "text-white"
              }`}
            >
              {countdown.text}
            </div>
          </div>
        </div>

        {/* Scope Completion */}
        <div className="p-4 rounded-xl bg-[#0e1626] border border-white/[0.06] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 grid place-items-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Scope Completion
            </div>
            <div className="text-sm font-bold text-white">
              {completedIssues} of {totalIssues} Issues ({issueCompletionPercent}%)
            </div>
          </div>
        </div>

        {/* Story Points */}
        <div className="p-4 rounded-xl bg-[#0e1626] border border-white/[0.06] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20 grid place-items-center">
            <Target size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Story Points
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {completedPoints} of {totalPoints} Points ({pointsPercent}%)
            </div>
          </div>
        </div>
      </div>

      {/* Progress Distribution Bar */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">Progress Distribution</span>
          <span className="font-mono font-bold text-cyan-300">
            {issueCompletionPercent}% Complete
          </span>
        </div>

        {/* Multi-Segment Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex p-0.5 border border-white/10">
          {completedIssues > 0 && (
            <div
              style={{ width: `${issueCompletionPercent}%` }}
              className="h-full bg-emerald-400 rounded-l-full transition-all duration-300"
              title={`Done: ${completedIssues} issues (${issueCompletionPercent}%)`}
            />
          )}
          {inProgressIssues > 0 && (
            <div
              style={{ width: `${inProgressPercent}%` }}
              className="h-full bg-amber-400 transition-all duration-300"
              title={`In Progress: ${inProgressIssues} issues (${inProgressPercent}%)`}
            />
          )}
          {todoIssues > 0 && (
            <div
              style={{ width: `${todoPercent}%` }}
              className="h-full bg-sky-400 rounded-r-full transition-all duration-300"
              title={`To Do: ${todoIssues} issues (${todoPercent}%)`}
            />
          )}
        </div>

        {/* Breakdown Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>
              Done: <strong className="text-slate-200">{completedIssues}</strong> ({issueCompletionPercent}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>
              In Progress: <strong className="text-slate-200">{inProgressIssues}</strong> ({inProgressPercent}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>
              To Do: <strong className="text-slate-200">{todoIssues}</strong> ({todoPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] flex-wrap gap-3">
        <button
          onClick={onOpenBacklogTray}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0e1626] hover:bg-[#141f36] text-cyan-300 border border-cyan-400/30 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus size={14} />
          Add Issues from Backlog
        </button>

        <button
          onClick={onCompleteSprint}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
        >
          <Flag size={14} />
          Complete Sprint 🏁
        </button>
      </div>
    </div>
  );
}
