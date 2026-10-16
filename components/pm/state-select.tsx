import React from "react";
import { CircleDashed, Circle, Clock, CheckCircle2, XCircle } from "lucide-react";

export type IssueState = "backlog" | "todo" | "in_progress" | "done" | "canceled";

interface StateIconProps {
  state: IssueState;
  size?: number;
  className?: string;
}

export function StateIcon({ state, size = 14, className = "" }: StateIconProps) {
  switch (state) {
    case "backlog":
      return <CircleDashed size={size} className={`text-slate-500 ${className}`} />;
    case "todo":
      return <Circle size={size} className={`text-slate-300 ${className}`} />;
    case "in_progress":
      return <Clock size={size} className={`text-amber-400 ${className}`} />;
    case "done":
      return <CheckCircle2 size={size} className={`text-emerald-400 ${className}`} />;
    case "canceled":
      return <XCircle size={size} className={`text-slate-500 ${className}`} />;
  }
}

export const STATE_CONFIG: Record<IssueState, { label: string; color: string; bg: string; border: string }> = {
  backlog: { label: "Backlog", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  todo: { label: "To Do", color: "text-slate-200", bg: "bg-slate-300/10", border: "border-slate-300/20" },
  in_progress: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  done: { label: "Done", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  canceled: { label: "Canceled", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

interface StateSelectProps {
  value: IssueState;
  onChange: (state: IssueState) => void;
  disabled?: boolean;
}

export function StateSelect({ value, onChange, disabled }: StateSelectProps) {
  const options: { label: string; value: IssueState }[] = [
    { label: "Backlog", value: "backlog" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Done", value: "done" },
    { label: "Canceled", value: "canceled" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as IssueState)}
        aria-label="Select state"
        className="appearance-none pl-7 pr-4 py-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-xs font-medium text-slate-200 hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-300 disabled:opacity-50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f172a] text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute left-2 flex items-center">
        <StateIcon state={value} size={14} />
      </div>
    </div>
  );
}
