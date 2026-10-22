"use client";

import React, { forwardRef } from "react";

export interface PlaneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const PlaneInput = forwardRef<HTMLInputElement, PlaneInputProps>(
  (
    {
      leftIcon,
      rightIcon,
      error,
      helperText,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`w-full bg-[#0e1626] text-slate-100 placeholder-slate-500 text-xs rounded-lg border transition-all outline-none py-2 ${
              leftIcon ? "pl-9" : "pl-3"
            } ${rightIcon ? "pr-9" : "pr-3"} ${
              error
                ? "border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50"
                : "border-white/[0.12] hover:border-white/[0.20] focus:border-[#00f5d4]/60 focus:ring-1 focus:ring-[#00f5d4]/50"
            } disabled:opacity-50 disabled:bg-[#070b13] disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-rose-400 font-medium pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

PlaneInput.displayName = "PlaneInput";
