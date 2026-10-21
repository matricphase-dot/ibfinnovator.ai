import React from "react";
import type { Metadata } from "next";
import { IbfWorkspaceShell } from "@/components/ibf/layout/ibf-workspace-shell";

export const metadata: Metadata = {
  title: "IBF Foundry · Workspace",
  description: "Authentic Plane.so workspace navigation and venture execution engine.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IbfWorkspaceShell showTabs={true}>{children}</IbfWorkspaceShell>;
}
