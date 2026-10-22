import React from "react";
import type { Metadata } from "next";
import { IbfWorkspaceShell } from "@/components/ibf/layout/ibf-workspace-shell";

export const metadata: Metadata = {
  title: "Workspace · Innovators.ai",
  description: "Plane workspace navigation and venture execution engine.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
