import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
if (!existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

const env = new Map();
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  env.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ""));
}
const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !serviceKey || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const requiredColumns = {
  profiles: ["last_seen_at"],
  projects: ["attachments"],
  messages: ["channel", "parent_id", "attachments", "pinned", "read_at", "edited_at", "deleted_at", "updated_at"],
  message_edits: ["editor_id", "previous_content"],
  team_rooms: ["channels"],
  meetings: ["location"],
  milestones: ["due_date", "assigned_to", "sort_order"],
  bookmarks: ["profile_id"],
  notifications: ["message", "delivered_email_at"],
  endorsements: ["project_id"],
};
const requiredTables = [
  "profiles", "projects", "open_roles", "applications", "connections", "messages",
  "message_reactions", "message_edits", "team_rooms", "team_members", "team_tasks",
  "meetings", "meeting_attendees", "milestones", "bookmarks", "notifications", "reviews",
  "endorsements", "badge_definitions", "user_badges", "certificates", "cofounder_profiles",
  "match_actions", "investor_inquiries", "marketplace_services", "service_inquiries",
  "service_purchases", "community_events", "event_attendees", "universities",
  "university_members", "reports", "user_blocks", "analytics_events", "admin_audit_log",
];

const failures = [];
const { data: contract, error: contractError } = await service.rpc("schema_contract");
if (contractError) failures.push(`schema_contract RPC: ${contractError.message}`);
else {
  if (contract?.unsafe_api_privileges !== 0)
    failures.push(`unsafe API-role table privileges: ${contract?.unsafe_api_privileges}`);
  if (contract?.authenticated_rpc_count !== 10)
    failures.push(`authenticated RPC privilege count: ${contract?.authenticated_rpc_count}`);
  if (contract?.certificate_default_privilege !== true)
    failures.push("certificate default generator is not executable by authenticated");
  if (contract?.unsafe_default_privileges !== 0)
    failures.push(
      `project-controllable default privileges expose API roles: ${contract?.unsafe_default_privileges} — paste supabase/hotfix_default_privileges.sql into the Supabase SQL Editor and re-run this script`,
    );
  if (contract?.platform_default_privileges !== undefined)
    console.log(
      `note: ${contract.platform_default_privileges} default-privilege entries in public are owned by the Supabase platform role and are read-only from a project connection; per-object privileges are audited below`,
    );
  if (contract?.sensitive_column_privileges !== 0)
    failures.push(`sensitive column privileges: ${contract?.sensitive_column_privileges}`);
  const deleteActions = contract?.fk_delete_actions || {};
  for (const [name, valid] of Object.entries(deleteActions)) {
    if (valid !== true) failures.push(`FK delete action is not SET NULL: ${name}`);
  }
  if (Object.keys(deleteActions).length !== 11)
    failures.push("schema_contract did not report all reconciled foreign keys");
}
for (const table of requiredTables) {
  const { error } = await service.from(table).select("*", { count: "exact", head: true });
  if (error) failures.push(`${table}: ${error.message}`);
}
for (const [table, columns] of Object.entries(requiredColumns)) {
  const { error } = await service.from(table).select(columns.join(",")).limit(0);
  if (error) failures.push(`${table} columns: ${error.message}`);
}
const { data: stats, error: statsError } = await anon.rpc("get_public_stats");
if (statsError) failures.push(`get_public_stats RPC: ${statsError.message}`);
else {
  const keys = ["users", "projects", "matches", "activeProjects"];
  if (!stats || keys.some((key) => typeof stats[key] !== "number"))
    failures.push("get_public_stats returned an invalid payload");
  // The security-definer RPC bypasses RLS, so it must not disclose more than the
  // anonymous role can already see.
  const { count: visibleProjects, error: projectCountError } = await anon
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "OPEN");
  if (projectCountError) failures.push(`anonymous project count: ${projectCountError.message}`);
  else if (stats.projects !== visibleProjects)
    failures.push(`get_public_stats projects ${stats.projects} != anon-visible ${visibleProjects}`);
  const { count: visibleUsers, error: userCountError } = await anon
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (userCountError) failures.push(`anonymous profile count: ${userCountError.message}`);
  else if (stats.users !== visibleUsers)
    failures.push(`get_public_stats users ${stats.users} != anon-visible ${visibleUsers}`);
}

const { data: buckets, error: bucketError } = await service.storage.listBuckets();
if (bucketError) failures.push(`storage buckets: ${bucketError.message}`);
else {
  const ids = new Set((buckets || []).map((bucket) => bucket.id));
  for (const id of ["avatars", "resumes", "project-files", "team-files", "service-portfolios"]) {
    if (!ids.has(id)) failures.push(`storage bucket missing: ${id}`);
  }
}

// Anonymous reads the public site depends on, exercised exactly as the routes do.
const anonReads = [
  ["investors listing", "profiles", "id,name,username,company,industry,investor_pitch,avatar_url,projects!founder_id(id,title,stage,domain,status)"],
  ["public profile", "profiles", "id,name,username,bio,skills,company"],
  ["project listings", "projects", "id,title,status,created_at,founder_id"],
  ["open roles", "open_roles", "*"],
  ["marketplace services", "marketplace_services", "*"],
  ["community events", "community_events", "*"],
  ["event attendees", "event_attendees", "*"],
  ["badge definitions", "badge_definitions", "*"],
  ["user badges", "user_badges", "*"],
  ["certificates", "certificates", "*"],
  ["reviews", "reviews", "*"],
  ["endorsements", "endorsements", "*"],
  ["milestones", "milestones", "*"],
  ["universities", "universities", "id,name,domain,logo_url,active,created_at"],
];
for (const [label, table, columns] of anonReads) {
  const { error } = await anon.from(table).select(columns).limit(1);
  if (error) failures.push(`anonymous read failed for ${label}: ${error.message}`);
}

// The column-scoped grants must still deny the sensitive reads.
const anonDenials = [
  ["profiles.email", "profiles", "email"],
  ["profiles.suspended", "profiles", "suspended"],
  ["universities.api_key", "universities", "api_key"],
  ["messages", "messages", "*"],
  ["notifications", "notifications", "*"],
];
for (const [label, table, columns] of anonDenials) {
  const { error } = await anon.from(table).select(columns).limit(1);
  if (!error) failures.push(`anonymous read unexpectedly allowed: ${label}`);
}

if (failures.length) {
  console.error("Supabase verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Supabase verification passed: ${requiredTables.length} tables, required columns, RPCs, public stats, storage buckets, ${anonReads.length} anonymous reads, and ${anonDenials.length} denied reads.`,
);
