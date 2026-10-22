"use client";

import React from "react";
import { User } from "lucide-react";

export type PlaneAvatarSize = "xs" | "sm" | "md" | "lg";

interface PlaneAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: PlaneAvatarSize;
  className?: string;
}

export function PlaneAvatar({
  src,
  name,
  size = "md",
  className = "",
}: PlaneAvatarProps) {
  const initials = (name || "Member")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses: Record<PlaneAvatarSize, { box: string; text: string; icon: number }> = {
    xs: { box: "w-4 h-4", text: "text-[8px]", icon: 9 },
    sm: { box: "w-5 h-5", text: "text-[9px]", icon: 11 },
    md: { box: "w-7 h-7", text: "text-[11px]", icon: 14 },
    lg: { box: "w-9 h-9", text: "text-xs", icon: 16 },
  };

  const sz = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User Avatar"}
        className={`${sz.box} rounded-full object-cover border border-white/10 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sz.box} rounded-full bg-[#182645] border border-white/10 text-cyan-300 font-mono font-bold grid place-items-center shrink-0 select-none ${sz.text} ${className}`}
      title={name || "Member"}
    >
      {initials || <User size={sz.icon} />}
    </div>
  );
}
