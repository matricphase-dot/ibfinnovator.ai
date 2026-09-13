export const locale = "en" as const;
export const dictionary = {
  common: {
    save: "Save",
    cancel: "Cancel",
    loading: "Loading…",
    error: "Something went wrong",
    retry: "Try again",
  },
  nav: {
    dashboard: "Dashboard",
    projects: "Projects",
    matches: "Matches",
    messages: "Messages",
    settings: "Settings",
  },
  auth: { signIn: "Sign in", signUp: "Create account", signOut: "Sign out" },
} as const;
export function t(path: string): string {
  let value: any = dictionary;
  for (const key of path.split(".")) value = value?.[key];
  return typeof value === "string" ? value : path;
}
// English is the source locale. Add Hindi and Spanish dictionaries without changing component APIs.
