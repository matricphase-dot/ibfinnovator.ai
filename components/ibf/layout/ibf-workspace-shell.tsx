"use client";

import React from "react";
import {
  IbfWorkspaceProvider,
  useWorkspace,
  IbfViewSection,
} from "./workspace-context";
import { IbfSidebar } from "./ibf-sidebar";
import { IbfTopbar, IbfViewType } from "./ibf-topbar";
import { IbfMobileDrawer } from "./ibf-mobile-drawer";
import { IbfCommandPalette } from "./ibf-command-palette";
import { IbfCreateProjectModal } from "./ibf-create-project-modal";
import { IbfCreateWorkspaceModal } from "./ibf-create-workspace-modal";
import { IssueModal } from "@/components/ibf/issues/issue-modal";
import { IssueState } from "@/components/pm/state-select";

export interface IbfWorkspaceShellProps {
  children: React.ReactNode;
  activeView?: IbfViewType;
  onViewChange?: (view: "board" | "list" | "cycles" | "modules" | "pages" | "settings") => void;
  showTabs?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

function WorkspaceShellInner({
  children,
  activeView,
  onViewChange,
  showTabs = true,
  breadcrumbs,
}: IbfWorkspaceShellProps) {
  const {
    currentWorkspace,
    workspaces,
    projects,
    activeProjectId,
    activeProject,
    activeSection,
    isCollapsed,
    isMobileOpen,
    isCommandPaletteOpen,
    isCreateIssueOpen,
    createIssueProjectId,
    createIssueDefaultState,
    isCreateProjectOpen,
    isCreateWorkspaceOpen,
    userProfile,
    toggleCollapse,
    setMobileOpen,
    setCommandPaletteOpen,
    openCreateIssue,
    closeCreateIssue,
    openCreateProject,
    closeCreateProject,
    openCreateWorkspace,
    closeCreateWorkspace,
    switchWorkspace,
    selectProject,
    addOptimisticProject,
    addOptimisticWorkspace,
    refreshData,
  } = useWorkspace();

  const currentView = activeView || (activeSection as IbfViewType) || "board";

  const effectiveCounts = activeProject
    ? {
        issues: activeProject.issue_count,
        cycles: activeProject.active_cycle_count,
        modules: activeProject.module_count,
        pages: activeProject.page_count,
      }
    : undefined;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* 1. Desktop 260px Workspace Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <IbfSidebar
          currentWorkspace={
            currentWorkspace || {
              id: "default",
              name: "IBF Foundry",
              slug: "ibf-foundry",
            }
          }
          projects={projects}
          activeProjectId={activeProjectId || undefined}
          activeSection={activeSection}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          workspaces={workspaces}
          onSelectWorkspace={switchWorkspace}
          onCreateWorkspace={openCreateWorkspace}
          onCreateProject={openCreateProject}
          onOpenQuickIssue={(projId) => openCreateIssue(projId, "todo")}
          userProfile={userProfile}
        />
      </div>

      {/* 2. Responsive Mobile Drawer (< lg) */}
      <IbfMobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setMobileOpen(false)}
        currentWorkspace={
          currentWorkspace || {
            id: "default",
            name: "IBF Foundry",
            slug: "ibf-foundry",
          }
        }
        projects={projects}
        activeProjectId={activeProjectId || undefined}
        activeSection={activeSection}
        isCollapsed={false}
        onToggleCollapse={() => setMobileOpen(false)}
        workspaces={workspaces}
        onSelectWorkspace={switchWorkspace}
        onCreateWorkspace={openCreateWorkspace}
        onCreateProject={openCreateProject}
        onOpenQuickIssue={(projId) => openCreateIssue(projId, "todo")}
        userProfile={userProfile}
      />

      {/* 3. Main Workspace Canvas with Dynamic Topbar */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <IbfTopbar
          workspaceName={currentWorkspace?.name || "IBF Foundry"}
          projectName={activeProject?.name}
          projectIdentifier={activeProject?.identifier}
          projectId={activeProject?.id}
          activeView={currentView}
          onViewChange={onViewChange || ((view) => {
            if (activeProject) {
              selectProject(activeProject.id, view as IbfViewSection);
            }
          })}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenCreateIssue={() => openCreateIssue()}
          onToggleMobileSidebar={() => setMobileOpen(true)}
          counts={effectiveCounts}
          breadcrumbs={breadcrumbs}
          showTabs={showTabs}
        />

        {/* Scrollable Canvas */}
        <main className="flex-1 bg-[#080c14] overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* 4. Universal Command Palette (Cmd+K / Ctrl+K) */}
      <IbfCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId || undefined}
        onOpenCreateIssue={() => openCreateIssue()}
        onOpenCreateProject={openCreateProject}
      />

      {/* 5. Issue Creator Modal (Bound to 'C' Key & '+ New Issue' buttons) */}
      {createIssueProjectId && (
        <IssueModal
          isOpen={isCreateIssueOpen}
          onClose={closeCreateIssue}
          projectId={createIssueProjectId}
          defaultState={createIssueDefaultState as IssueState}
          onIssueCreated={() => {
            closeCreateIssue();
            refreshData();
          }}
        />
      )}

      {/* 6. Quick Project Creator Modal */}
      <IbfCreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={closeCreateProject}
        workspaceId={currentWorkspace?.id}
        onProjectCreated={(newProject) => {
          addOptimisticProject({
            id: newProject.id,
            name: newProject.title || newProject.name,
            identifier: newProject.identifier || "INN",
            issue_count: 0,
            active_cycle_count: 0,
            module_count: 0,
            page_count: 0,
          });
          selectProject(newProject.id, "board");
        }}
      />

      {/* 7. Quick Workspace Creator Modal */}
      <IbfCreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={closeCreateWorkspace}
        onWorkspaceCreated={(newWs) => {
          addOptimisticWorkspace(newWs);
        }}
      />
    </div>
  );
}

export function IbfWorkspaceShell(props: IbfWorkspaceShellProps) {
  return (
    <IbfWorkspaceProvider>
      <WorkspaceShellInner {...props} />
    </IbfWorkspaceProvider>
  );
}
