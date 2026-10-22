"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type PlaneButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type PlaneButtonSize = "xs" | "sm" | "md" | "lg";

export interface PlaneButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PlaneButtonVariant;
  size?: PlaneButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PlaneButton = forwardRef<HTMLButtonElement, PlaneButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // 8-State styling: default, hover, focus-visible, active, disabled, loading
    const variantStyles: Record<PlaneButtonVariant, string> = {
      primary:
        "bg-[#00f5d4] text-slate-950 font-bold hover:bg-[#2bfde1] active:bg-[#00d6b9] shadow-sm shadow-[#00f5d4]/20 border border-[#00f5d4]/40 focus-visible:ring-2 focus-visible:ring-[#00f5d4] focus-visible:ring-offset-1 focus-visible:ring-offset-[#080c14]",
      secondary:
        "bg-[#131f38] text-slate-100 hover:bg-[#182645] hover:text-white active:bg-[#1e2f54] border border-white/[0.12] hover:border-white/[0.20] focus-visible:ring-2 focus-visible:ring-[#00f5d4] focus-visible:ring-offset-1 focus-visible:ring-offset-[#080c14]",
      outline:
        "bg-transparent text-slate-200 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10] border border-white/[0.16] hover:border-white/[0.30] focus-visible:ring-2 focus-visible:ring-[#00f5d4]",
      ghost:
        "bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.10] border border-transparent focus-visible:ring-2 focus-visible:ring-[#00f5d4]",
      danger:
        "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 hover:text-rose-200 active:bg-rose-500/35 border border-rose-500/30 focus-visible:ring-2 focus-visible:ring-rose-500",
    };

    const sizeStyles: Record<PlaneButtonSize, string> = {
      xs: "px-2 py-1 text-[11px] gap-1 rounded-[4px] min-h-[26px]",
      sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-[6px] min-h-[30px]",
      md: "px-3.5 py-2 text-xs font-semibold gap-2 rounded-[8px] min-h-[36px]",
      lg: "px-4.5 py-2.5 text-sm font-semibold gap-2.5 rounded-[8px] min-h-[42px]",
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium transition-all duration-100 cursor-pointer select-none outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === "xs" ? 11 : size === "sm" ? 13 : 15} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

PlaneButton.displayName = "PlaneButton";
