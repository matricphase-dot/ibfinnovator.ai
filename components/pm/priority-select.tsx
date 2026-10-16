import React from "react";
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

interface PriorityIconProps {
  priority: Priority;
  size?: number;
  className?: string;
}

export function PriorityIcon({ priority, size = 14, className = "" }: PriorityIconProps) {
  switch (priority) {
    case "urgent":
      return <AlertCircle size={size} className={`text-red-500 ${className}`} />;
    case "high":
      return <ArrowUp size={size} className={`text-orange-400 ${className}`} />;
    case "medium":
      return <AlertTriangle size={size} className={`text-yellow-400 ${className}`} />;
    case "low":
      return <ArrowDown size={size} className={`text-blue-400 ${className}`} />;
    case "none":
    default:
      return <Minus size={size} className={`text-slate-500 ${className}`} />;
  }
}

interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

export function PrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  const options: { label: string; value: Priority }[] = [
    { label: "Urgent", value: "urgent" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
    { label: "None", value: "none" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Priority)}
        aria-label="Select priority"
        className="appearance-none pl-7 pr-4 py-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-xs font-medium text-slate-200 hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-300 disabled:opacity-50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f172a] text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute left-2 flex items-center">
        <PriorityIcon priority={value} size={14} />
      </div>
    </div>
  );
}
