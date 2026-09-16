export type AuthenticatedProfile = {
  id: string;
  clerkId: string | null;
  supabaseId: string | null;
  email: string;
  name: string;
  role: "FOUNDER" | "STUDENT" | "SUPER_ADMIN";
  onboarding_completed: boolean;
  provider: "clerk" | "supabase";
};
