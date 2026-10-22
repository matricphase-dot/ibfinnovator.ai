"use client";

import React, { useState } from "react";
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  Flag,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

// -------------------------------------------------------------
// 1. Plane State Badge
// -------------------------------------------------------------
export type PlaneIssueState = "backlog" | "todo" | "in_progress" | "done" | "canceled";

interface PlaneStateBadgeProps {
  state: PlaneIssueState | string;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PlaneStateBadge({
  state,
  showIcon = true,
  size = "md",
  className = "",
}: PlaneStateBadgeProps) {
  const normState = (state || "todo").toLowerCase();

  const configs: Record<
    string,
    { label: string; icon: any; bg: string; text: string; border: string }
  > = {
    backlog: {
      label: "Backlog",
      icon: Layers,
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/20",
    },
    todo: {
      label: "To Do",
      icon: Circle,
      bg: "bg-slate-400/10",
      text: "text-slate-300",
      border: "border-slate-400/20",
    },
    in_progress: {
      label: "In Progress",
      icon: Clock,
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    done: {
      label: "Done",
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    canceled: {
      label: "Canceled",
      icon: XCircle,
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
    },
  };

  const conf = configs[normState] || configs.todo;
  const Icon = conf.icon;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-1 rounded-[4px]"
      : "text-[11px] px-2 py-0.5 gap-1.5 rounded-[6px]";

  return (
    <span
      className={`inline-flex items-center font-medium border font-mono select-none ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon size={size === "sm" ? 10 : 12} className="shrink-0" />}
      <span>{conf.label}</span>
    </span>
  );
}

// -------------------------------------------------------------
// 2. Plane Priority Badge
// -------------------------------------------------------------
export type PlanePriority = "urgent" | "high" | "medium" | "low" | "none";

interface PlanePriorityBadgeProps {
  priority: PlanePriority | string | null | undefined;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PlanePriorityBadge({
  priority,
  showLabel = true,
  size = "md",
  className = "",
}: PlanePriorityBadgeProps) {
  const normPriority = (priority || "none").toLowerCase();

  const configs: Record<
    string,
    { label: string; icon: any; color: string; border: string; bg: string }
  > = {
    urgent: {
      label: "Urgent",
      icon: Flag,
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
    },
    high: {
      label: "High",
      icon: SignalHigh,
      color: "text-orange-400",
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
    },
    medium: {
      label: "Medium",
      icon: SignalMedium,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    low: {
      label: "Low",
      icon: SignalLow,
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
    },
    none: {
      label: "None",
      icon: Minus,
      color: "text-slate-500",
      border: "border-white/[0.08]",
      bg: "bg-white/[0.04]",
    },
  };

  const conf = configs[normPriority] || configs.none;
  const Icon = conf.icon;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-1 rounded-[4px]"
      : "text-[11px] px-2 py-0.5 gap-1.5 rounded-[6px]";

  return (
    <span
      className={`inline-flex items-center font-medium border font-mono select-none ${conf.bg} ${conf.color} ${conf.border} ${sizeClasses} ${className}`}
      title={`Priority: ${conf.label}`}
    >
      <Icon size={size === "sm" ? 10 : 12} className="shrink-0" />
      {showLabel && <span>{conf.label}</span>}
    </span>
  );
}

// -------------------------------------------------------------
// 3. Plane Sequence Badge (#INN-42)
// -------------------------------------------------------------
interface PlaneSequenceBadgeProps {
  identifier: string; // e.g. "INN" or "INN-42"
  sequence?: number | string;
  enableCopy?: boolean;
  className?: string;
}

export function PlaneSequenceBadge({
  identifier,
  sequence,
  enableCopy = true,
  className = "",
}: PlaneSequenceBadgeProps) {
  const [copied, setCopied] = useState(false);

  const fullId =
    sequence !== undefined && sequence !== null
      ? `${identifier}-${sequence}`
      : identifier.startsWith("#")
      ? identifier.slice(1)
      : identifier;

  function handleCopy(e: React.MouseEvent) {
    if (!enableCopy) return;
    e.stopPropagation();
    navigator.clipboard
      .writeText(fullId)
      .then(() => {
        setCopied(true);
        toast.success(`Copied ${fullId}`);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <span
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 px-2 py-0.5 rounded-[5px] transition cursor-pointer select-none group ${className}`}
      title={enableCopy ? `Click to copy ${fullId}` : fullId}
    >
      <span>#{fullId}</span>
      {enableCopy &&
        (copied ? (
          <Check size={10} className="text-emerald-400 shrink-0" />
        ) : (
          <Copy
            size={10}
            className="opacity-0 group-hover:opacity-100 transition text-cyan-300 shrink-0"
          />
        ))}
    </span>
  );
}
