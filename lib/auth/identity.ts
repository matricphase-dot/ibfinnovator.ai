export type UserRole = "FOUNDER" | "STUDENT" | "SUPER_ADMIN";

export type AuthenticatedProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  onboarding_completed: boolean;
  provider: "supabase";
};
