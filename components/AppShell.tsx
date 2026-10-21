"use client";

import React from "react";
import { IbfWorkspaceShell, IbfWorkspaceShellProps } from "./ibf/layout/ibf-workspace-shell";

export interface AppShellProps extends Partial<IbfWorkspaceShellProps> {
  children: React.ReactNode;
}

export default function AppShell({
  children,
  activeView,
  onViewChange,
  showTabs = false, // When inside global dashboard or general pages, tabs can be hidden or shown if active project exists
  breadcrumbs,
}: AppShellProps) {
  return (
    <IbfWorkspaceShell
      activeView={activeView}
      onViewChange={onViewChange}
      showTabs={showTabs}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </IbfWorkspaceShell>
  );
}
