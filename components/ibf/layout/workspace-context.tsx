"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface IbfWorkspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface IbfProject {
  id: string;
  name: string;
  identifier: string;
  emoji?: string;
  domain?: string;
  stage?: string;
  description?: string;
  workspace_id?: string;
  issue_count: number;
  active_cycle_count: number;
  module_count: number;
  page_count: number;
}

export interface IbfUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

export type IbfViewSection = "board" | "list" | "cycles" | "modules" | "pages" | "analytics" | "settings";

interface WorkspaceContextType {
  currentWorkspace: IbfWorkspace | null;
  workspaces: IbfWorkspace[];
  projects: IbfProject[];
  activeProjectId: string | null;
  activeProject: IbfProject | null;
  activeSection: IbfViewSection;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCreateIssueOpen: boolean;
  createIssueProjectId: string | null;
  createIssueDefaultState: string;
  isCreateProjectOpen: boolean;
  isCreateWorkspaceOpen: boolean;
  userProfile: IbfUserProfile | null;
  loading: boolean;
  toggleCollapse: () => void;
  setMobileOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openCreateIssue: (projectId?: string, defaultState?: string) => void;
  closeCreateIssue: () => void;
  openCreateProject: () => void;
  closeCreateProject: () => void;
  openCreateWorkspace: () => void;
  closeCreateWorkspace: () => void;
  switchWorkspace: (workspaceId: string) => void;
  selectProject: (projectId: string, section?: IbfViewSection) => void;
  setActiveSection: (section: IbfViewSection) => void;
  refreshData: () => Promise<void>;
  addOptimisticProject: (project: IbfProject) => void;
  addOptimisticWorkspace: (workspace: IbfWorkspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within an IbfWorkspaceProvider");
  }
  return ctx;
}

export function IbfWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentWorkspace, setCurrentWorkspace] = useState<IbfWorkspace | null>(null);
  const [workspaces, setWorkspaces] = useState<IbfWorkspace[]>([]);
  const [projects, setProjects] = useState<IbfProject[]>([]);
  const [userProfile, setUserProfile] = useState<IbfUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [createIssueProjectId, setCreateIssueProjectId] = useState<string | null>(null);
  const [createIssueDefaultState, setCreateIssueDefaultState] = useState<string>("todo");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  // Parse active project and section from pathname:
  // e.g. /projects/[id]/[section]
  let pathProjectId: string | null = null;
  let pathSection: IbfViewSection = "board";

  if (pathname) {
    const match = pathname.match(/\/projects\/([^/]+)(?:\/([^/]+))?/);
    if (match && match[1] !== "new") {
      pathProjectId = match[1];
      const sub = match[2];
      if (sub === "list" || sub === "cycles" || sub === "modules" || sub === "pages" || sub === "analytics" || sub === "settings") {
        pathSection = sub;
      } else {
        pathSection = "board";
      }
    }
  }

  const [explicitProjectId, setExplicitProjectId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<IbfViewSection>(pathSection);

  const activeProjectId = explicitProjectId || pathProjectId || (projects.length > 0 ? projects[0].id : null);
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Sync active section when path changes
  useEffect(() => {
    if (pathSection) {
      setActiveSection(pathSection);
    }
  }, [pathSection]);

  const refreshData = useCallback(async (requestedWsId?: string) => {
    try {
      const url = requestedWsId ? `/api/workspace?workspace_id=${requestedWsId}` : "/api/workspace";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          // Unauthenticated
          return;
        }
        throw new Error("Failed to load workspace data");
      }
      const data = await res.json();
      if (data.workspace) setCurrentWorkspace(data.workspace);
      if (data.workspaces) setWorkspaces(data.workspaces);
      if (data.projects) setProjects(data.projects);
      if (data.userProfile) setUserProfile(data.userProfile);
    } catch (err) {
      console.error("Workspace context load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Read sidebar collapse from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ibf_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ibf_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const switchWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      refreshData(workspaceId);
    }
  }, [workspaces, refreshData]);

  const selectProject = useCallback((projectId: string, section: IbfViewSection = "board") => {
    setExplicitProjectId(projectId);
    setActiveSection(section);
    router.push(`/projects/${projectId}/${section}`);
    setIsMobileOpen(false);
  }, [router]);

  const openCreateIssue = useCallback((projectId?: string, defaultState: string = "todo") => {
    setCreateIssueProjectId(projectId || activeProjectId || (projects[0]?.id ?? null));
    setCreateIssueDefaultState(defaultState);
    setIsCreateIssueOpen(true);
  }, [activeProjectId, projects]);

  const closeCreateIssue = useCallback(() => {
    setIsCreateIssueOpen(false);
    setCreateIssueProjectId(null);
  }, []);

  const openCreateProject = useCallback(() => {
    setIsCreateProjectOpen(true);
  }, []);

  const closeCreateProject = useCallback(() => {
    setIsCreateProjectOpen(false);
  }, []);

  const openCreateWorkspace = useCallback(() => {
    setIsCreateWorkspaceOpen(true);
  }, []);

  const closeCreateWorkspace = useCallback(() => {
    setIsCreateWorkspaceOpen(false);
  }, []);

  const addOptimisticProject = useCallback((project: IbfProject) => {
    setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
    setExplicitProjectId(project.id);
  }, []);

  const addOptimisticWorkspace = useCallback((workspace: IbfWorkspace) => {
    setWorkspaces((prev) => [workspace, ...prev.filter((w) => w.id !== workspace.id)]);
    setCurrentWorkspace(workspace);
  }, []);

  // Global Keyboard Shortcuts (Cmd+K, Ctrl+K, and C)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K triggers command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Pressing 'C' opens quick issue creator
      if (e.key === "c" || e.key === "C") {
        // Prevent if modifier keys are pressed
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        openCreateIssue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openCreateIssue]);

  return (
    <WorkspaceContext.Provider
      value={{
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
        loading,
        toggleCollapse,
        setMobileOpen: setIsMobileOpen,
        setCommandPaletteOpen: setIsCommandPaletteOpen,
        openCreateIssue,
        closeCreateIssue,
        openCreateProject,
        closeCreateProject,
        openCreateWorkspace,
        closeCreateWorkspace,
        switchWorkspace,
        selectProject,
        setActiveSection,
        refreshData,
        addOptimisticProject,
        addOptimisticWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
