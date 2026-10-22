"use client";

import React from "react";

interface PlaneProgressProps {
  value?: number; // 0 to 100
  percent?: number; // alias for value
  size?: "sm" | "md" | "lg";
  variant?: "accent" | "emerald" | "amber";
  showLabel?: boolean;
  className?: string;
}

export function PlaneProgress({
  value,
  percent,
  size = "md",
  variant = "accent",
  showLabel = false,
  className = "",
}: PlaneProgressProps) {
  const raw = value !== undefined ? value : percent !== undefined ? percent : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(raw)));

  const heightClasses = {
    sm: "h-1 rounded-[2px]",
    md: "h-1.5 rounded-[3px]",
    lg: "h-2.5 rounded-[4px]",
  };

  const fillColors = {
    accent: "bg-cyan-400 shadow-sm shadow-cyan-400/20",
    emerald: "bg-emerald-400 shadow-sm shadow-emerald-400/20",
    amber: "bg-amber-400 shadow-sm shadow-amber-400/20",
  };

  return (
    <div className={`w-full flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-white/[0.08] overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${fillColors[variant]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono text-slate-400 shrink-0 min-w-[28px] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}

interface PlaneRadialProgressProps {
  value: number; // 0 to 100
  size?: number; // diameter in px (default 36)
  strokeWidth?: number; // default 3.5
  className?: string;
}

export function PlaneRadialProgress({
  value,
  size = 36,
  strokeWidth = 3.5,
  className = "",
}: PlaneRadialProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00f5d4"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-bold text-slate-200">
        {clamped}%
      </span>
    </div>
  );
}
