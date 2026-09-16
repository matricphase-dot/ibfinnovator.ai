import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared authorization checks for credential APIs.
 *
 * RLS already stops a non-founder from inserting a badge or certificate, but a
 * policy violation surfaces as an opaque 400. These checks run first so the
 * caller gets a precise 403, and they add the rule RLS cannot express: the
 * receiver must be an *accepted* collaborator on that project, not merely any
 * profile id the founder happens to know.
 */

export interface CheckFailure {
  status: number;
  error: string;
}

/** null = allowed, otherwise the status and message to return. */
export async function checkFounderAwardsMember(
  supabase: SupabaseClient,
  actorId: string,
  projectId: string,
  receiverId: string,
): Promise<CheckFailure | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("founder_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { status: 404, error: "Project not found." };
  if (project.founder_id !== actorId) {
    return {
      status: 403,
      error: "Only the project founder can award credentials for this project.",
    };
  }

  if (receiverId === actorId) {
    return { status: 400, error: "You cannot award a credential to yourself." };
  }

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id,recipient_id")
    .eq("project_id", projectId)
    .eq("status", "ACCEPTED")
    .or(`requester_id.eq.${receiverId},recipient_id.eq.${receiverId}`);

  if (!connections?.length) {
    return {
      status: 403,
      error: "This person is not an accepted collaborator on the project.",
    };
  }

  return null;
}

/** True when the error is a Postgres unique-violation (duplicate row). */
export function isDuplicate(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

/**
 * True when the member is part of the project — its founder, or an accepted
 * collaborator. Used to keep reviews between people who actually worked
 * together, rather than letting any member review any stranger.
 */
export async function isProjectCollaborator(
  supabase: SupabaseClient,
  projectId: string,
  profileId: string,
): Promise<boolean> {
  const { data: project } = await supabase
    .from("projects")
    .select("founder_id")
    .eq("id", projectId)
    .maybeSingle();

  if (project?.founder_id === profileId) return true;

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id,recipient_id")
    .eq("project_id", projectId)
    .eq("status", "ACCEPTED")
    .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);

  return !!connections?.length;
}
