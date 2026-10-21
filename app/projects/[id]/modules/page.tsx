import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/public";
import { ProjectManagementWorkspace } from "@/components/pm/pm-workspace";
import AppShell from "@/components/AppShell";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProject(id: string) {
  const { data, error } = await supabasePublic
    .from("projects")
    .select("id, name, title, identifier, description, workspace_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Project Not Found" };

  const name = project.name || project.title || "Project";
  return {
    title: `${name} (${project.identifier || "INN"}) · Feature Modules`,
    description: `Track high-level feature epics and roadmaps for ${name}.`,
  };
}

export default async function ProjectModulesPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const projectName = project.name || project.title || "Innovator Project";
  const identifier = project.identifier || "INN";

  return (
    <AppShell activeView="modules" showTabs={true}>
      <ProjectManagementWorkspace
        projectId={id}
        projectName={projectName}
        projectIdentifier={identifier}
        initialTab="modules"
        hideTopBar={true}
      />
    </AppShell>
  );
}

