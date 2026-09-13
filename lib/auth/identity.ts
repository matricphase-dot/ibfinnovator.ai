export type UserRole='FOUNDER'|'STUDENT'|'SUPER_ADMIN';
export type AuthenticatedProfile={id:string;clerkId?:string|null;supabaseId?:string|null;email:string;name:string;role:UserRole;onboarding_completed:boolean;provider:'clerk'|'supabase'};
