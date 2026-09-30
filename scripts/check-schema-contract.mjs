import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("../", import.meta.url)));
const normalize = (value) => value.replaceAll("\r\n", "\n");
const rootSql = normalize(readFileSync(join(root, "supabase", "PRODUCTION_SETUP_ROOT.sql"), "utf8"));
const migrationPath = join(root, "supabase", "migrations", "20260924000000_reconcile_production_contract.sql");
const migrationSql = normalize(readFileSync(migrationPath, "utf8"));
const types = normalize(readFileSync(join(root, "lib", "supabase", "database.types.ts"), "utf8"));
const failures = [];

const columnStatements = [
  ["profiles", "last_seen_at"],
  ["projects", "attachments"],
  ["messages", "channel"],
  ["messages", "parent_id"],
  ["messages", "attachments"],
  ["messages", "pinned"],
  ["messages", "read_at"],
  ["messages", "edited_at"],
  ["messages", "deleted_at"],
  ["messages", "updated_at"],
  ["message_edits", "editor_id"],
  ["message_edits", "previous_content"],
  ["team_rooms", "channels"],
  ["meetings", "location"],
  ["milestones", "due_date"],
  ["milestones", "assigned_to"],
  ["milestones", "sort_order"],
  ["bookmarks", "profile_id"],
  ["notifications", "message"],
  ["notifications", "delivered_email_at"],
  ["endorsements", "project_id"],
];
for (const [table, column] of columnStatements) {
  const pattern = new RegExp(`alter table public\\.${table} add column if not exists ${column}\\b`);
  if (!pattern.test(migrationSql)) failures.push(`migration missing column statement ${table}.${column}`);
  if (!pattern.test(rootSql)) failures.push(`root missing column statement ${table}.${column}`);
}
for (const token of [
  "current_profile_id",
  "current_user_profile",
  "touch_current_profile",
  "finalize_onboarding",
  "set_onboarding_role",
  "edit_message",
  "join_university",
  "get_public_stats",
  "schema_contract",
]) {
  if (!migrationSql.includes(token)) failures.push(`migration missing ${token}`);
  if (!rootSql.includes(token)) failures.push(`root missing ${token}`);
  if (!types.includes(token)) failures.push(`types missing ${token}`);
}
for (const token of [
  "team_tasks_created_by_fkey",
  "user_badges_awarded_by_fkey",
  "certificates_issued_by_fkey",
  "community_events_host_id_fkey",
  "reports_reporter_id_fkey",
  "service_purchases_service_id_fkey",
]) {
  if (!migrationSql.includes(token)) failures.push(`migration missing FK ${token}`);
}
if (!/on delete set null not valid/.test(migrationSql)) failures.push("migration missing SET NULL foreign keys");
if (!/grant execute on function public\.generate_certificate_code\(\) to authenticated/.test(migrationSql)) failures.push("authenticated certificate inserts cannot evaluate the verification-code default");
for (const signature of [
  "public.touch_current_profile()",
  "public.finalize_onboarding(",
  "public.set_onboarding_role(text)",
  "public.edit_message(uuid, text)",
  "public.join_university(uuid)",
  "public.delete_own_account()",
]) {
  if (!migrationSql.includes(`grant execute on function ${signature}`)) failures.push(`missing post-revoke RPC grant ${signature}`);
}
if (!/revoke select on public\.profiles, public\.universities from anon, authenticated/.test(migrationSql)) failures.push("migration missing sensitive-column revocation");
if (/grant select on public\.profiles to authenticated/.test(migrationSql)) failures.push("authenticated retains table-wide profile select");
if (/grant insert on public\.message_edits to authenticated/.test(migrationSql)) failures.push("authenticated can still insert message edits directly");
if (/grant all on all (?:tables|routines|sequences) in schema public to anon, authenticated/.test(migrationSql)) failures.push("migration grants broad API-role access");
if (/alter default privileges in schema public grant all on (?:tables|routines|sequences) to anon, authenticated/.test(migrationSql)) failures.push("migration grants broad default API-role access");
if (/polyname/.test(rootSql) || /polyname/.test(migrationSql)) failures.push("SQL references the invalid pg_policy column polyname");
if (/^\s*loop;\s*$/m.test(migrationSql)) failures.push("migration contains an unterminated loop");
if (!/begin;[\s\S]*notify pgrst, 'reload schema';[\s\S]*commit;/.test(rootSql)) failures.push("root does not end with a complete reconciliation transaction");

// The default-privilege strip must exist in the migration, the root artifact, and
// the standalone hotfix so the SQL Editor path cannot drift from the release.
const defaultAclStart = migrationSql.indexOf("do $$\ndeclare\n  acl_owner oid;");
if (defaultAclStart < 0) {
  failures.push("migration missing the default-privilege strip for project-owned default ACLs");
} else {
  const defaultAclBlock = migrationSql.slice(
    defaultAclStart,
    migrationSql.indexOf("end $$;", defaultAclStart) + "end $$;".length,
  ).trim();
  if (!rootSql.includes(defaultAclBlock)) failures.push("root artifact missing the default-privilege strip");
  const hotfixPath = join(root, "supabase", "hotfix_default_privileges.sql");
  if (!existsSync(hotfixPath)) failures.push("supabase/hotfix_default_privileges.sql is missing");
  else if (!normalize(readFileSync(hotfixPath, "utf8")).includes(defaultAclBlock))
    failures.push("supabase/hotfix_default_privileges.sql does not match the migration block");
}

const migrationsDir = join(root, "supabase", "migrations");
for (const name of readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"))) {
  const sql = normalize(readFileSync(join(migrationsDir, name), "utf8"));
  if (/grant all on all (?:tables|routines|sequences) in schema public to anon, authenticated/.test(sql)) failures.push(`${name} grants broad API-role access`);
  if (/alter default privileges in schema public grant all on (?:tables|routines|sequences) to anon, authenticated/.test(sql)) failures.push(`${name} grants broad default API-role access`);
}
for (const file of ["fresh_install_smoke.sql", "upgrade_smoke.sql"]) {
  const sql = normalize(readFileSync(join(root, "supabase", "tests", file), "utf8"));
  if (!/select plan\(\d+\)/.test(sql) || !/select ok\(/.test(sql)) failures.push(`${file} is not a TAP assertion suite`);
  const planned = Number(sql.match(/select plan\((\d+)\)/)?.[1] ?? -1);
  const asserted = (
    sql.match(
      /select\s+(ok|isnt|is|alike|unlike|like|matches|throws_ok|results_eq|lives_ok|die_ok|has_table|has_column|has_function|col_is_pk|col_is_fk|col_not_null|set_eq|bag_eq|is_empty|forms_ok)\s*\(/g,
    ) || []
  ).length;
  if (planned !== asserted) failures.push(`${file} plans ${planned} assertions but declares ${asserted}`);
}

// The API roles read column-scoped tables, so a query for a column that is not
// granted fails at runtime with `permission denied` even though typecheck passes.
// Cross-reference every application query against the effective grants.
const guarded = new Set(["profiles", "universities"]);
const splitTopLevel = (value) => {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};
const grants = {
  read: { anon: new Map(), authenticated: new Map() },
  write: { anon: new Map(), authenticated: new Map() },
};
for (const statement of migrationSql.matchAll(/grant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+);/gi)) {
  const [, privilegeList, tableList, roleList] = statement;
  const roles = splitTopLevel(roleList)
    .map((value) => value.toLowerCase())
    .filter((value) => value === "anon" || value === "authenticated");
  if (!roles.length) continue;
  const tables = splitTopLevel(tableList)
    .map((value) => value.toLowerCase().replace(/^public\./, ""))
    .filter((value) => guarded.has(value));
  if (!tables.length) continue;
  for (const privilege of splitTopLevel(privilegeList)) {
    const parsed = privilege.match(/^(\w+)(?:\s*\(([^)]*)\))?$/);
    if (!parsed) continue;
    const [, name, columnList] = parsed;
    const bucket = name.toLowerCase() === "select" ? grants.read : grants.write;
    const columns = splitTopLevel(columnList ?? "*");
    for (const role of roles) {
      for (const table of tables) {
        if (!bucket[role].has(table)) bucket[role].set(table, new Set());
        for (const column of columns) bucket[role].get(table).add(column);
      }
    }
  }
}
for (const role of ["anon", "authenticated"]) {
  for (const table of guarded) {
    if (!grants.read[role].has(table)) failures.push(`migration missing ${role} read grant for public.${table}`);
    if (grants.read[role].get(table)?.has("*")) failures.push(`${role} keeps table-wide read on public.${table}`);
  }
}

const sourceFiles = [];
const collectSources = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full);
    else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(full);
  }
};
collectSources(join(root, "app"));
collectSources(join(root, "lib"));

const roleTokens = [
  { role: "anon", token: /supabasePublic|getSupabasePublic/ },
  { role: "service", token: /supabaseAdmin|createAdminClient|getSupabaseAdmin|service_role/ },
];
const filterPattern =
  /\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|order|filter|match|contains|overlaps|textSearch|not)\(\s*["']([a-z_]+)["']/g;
const stringPattern = /(["'])((?:\\.|(?!\1)[^\\])*)\1/g;
const reservedIdentifiers = new Set([
  "count", "head", "exact", "true", "false", "null", "if", "else", "not", "undefined",
  "asc", "desc", "foreignTable", "referencedTable",
]);
// Row columns come from the generated types so an identifier that names a real
// column is still checked when the select argument is dynamic.
const rowColumns = new Map(
  ["ProfileRow", "UniversityRow"].map((name) => {
    const block = types.match(new RegExp(`type ${name} = \\{([\\s\\S]*?)\\n\\};`));
    return [
      name === "ProfileRow" ? "profiles" : "universities",
      new Set([...(block?.[1] ?? "").matchAll(/^\s+(\w+)[?:]/gm)].map((match) => match[1])),
    ];
  }),
);
const balancedArgument = (text, openIndex) => {
  let depth = 0;
  for (let index = openIndex; index < text.length; index++) {
    if (text[index] === "(") depth += 1;
    else if (text[index] === ")") {
      depth -= 1;
      if (depth === 0) return text.slice(openIndex + 1, index);
    }
  }
  return "";
};
for (const file of sourceFiles) {
  const text = normalize(readFileSync(file, "utf8"));
  const relative = file.slice(root.length).replaceAll("\\", "/");
  const stringConstants = new Map(
    [...text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(["'])((?:\\.|(?!\2)[^\\])*)\2/g)].map((match) => [
      match[1],
      match[3],
    ]),
  );
  const tableAnchors = [...text.matchAll(/from\(\s*["'](\w+)["']\s*\)/g)].map((match) => ({
    index: match.index,
    table: match[1],
  }));
  const roleAnchors = [];
  for (const candidate of roleTokens) {
    for (const match of text.matchAll(new RegExp(candidate.token.source, "g"))) {
      roleAnchors.push({ index: match.index, role: candidate.role });
    }
  }
  const nearest = (anchors, index, key) => {
    let best;
    for (const anchor of anchors) {
      if (anchor.index > index) break;
      if (!best || anchor.index > best.index) best = anchor;
    }
    return best?.[key];
  };
const requested = [];
const dynamicWrites = [];
const note = (role, columnTable, column, kind) => {
    if (role !== "service") requested.push({ role, table: columnTable, column, kind });
  };
  const roleAt = (index) => nearest(roleAnchors, index, "role") ?? "authenticated";
  const checkSelectList = (role, table, list) => {
    for (const part of splitTopLevel(list)) {
      const embedded = part.match(/^(?:[\w]+:)?(\w+)(?:!\w+)?\(/);
      if (embedded) {
        if (!guarded.has(embedded[1])) continue;
        const open = part.indexOf("(");
        const inner = part.slice(open + 1, part.lastIndexOf(")"));
        for (const column of splitTopLevel(inner)) {
          note(role, embedded[1], column.split(/[:(>-]/)[0].trim(), "read");
        }
        continue;
      }
      if (!guarded.has(table) || /^count$/i.test(part) || part.includes("(")) continue;
      note(role, table, part === "*" ? "*" : part.split(/[:(>-]/)[0].trim(), "read");
    }
  };
  for (const select of text.matchAll(/\.select\s*\(/g)) {
    const open = select.index + select[0].length - 1;
    const argument = balancedArgument(text, open);
    const role = roleAt(select.index);
    const table = nearest(tableAnchors, select.index, "table");
    for (const literal of argument.matchAll(stringPattern)) checkSelectList(role, table, literal[2]);
    const stripped = argument.replace(stringPattern, " ");
    for (const identifier of stripped.matchAll(/\b([A-Za-z_]\w*)\b/g)) {
      const name = identifier[1];
      if (reservedIdentifiers.has(name)) continue;
      if (stringConstants.has(name)) {
        checkSelectList(role, table, stringConstants.get(name));
        continue;
      }
      if (guarded.has(table) && rowColumns.get(table)?.has(name)) note(role, table, name, "read");
    }
  }
  if (tableAnchors.length) {
    for (const filter of text.matchAll(filterPattern)) {
      const table = nearest(tableAnchors, filter.index, "table");
      if (!guarded.has(table)) continue;
      note(roleAt(filter.index), table, filter[2], "read");
    }
    for (const write of text.matchAll(/\.(?:update|insert|upsert)\s*\(\s*\{/g)) {
      const table = nearest(tableAnchors, write.index, "table");
      if (!guarded.has(table)) continue;
      const role = roleAt(write.index);
      const body = balancedArgument(text, write.index + write[0].lastIndexOf("("))
        .replace(/^\s*\{/, "")
        .replace(/\}\s*$/, "");
      for (const key of body.matchAll(/(?:^|[,{\s])([a-z_]+)\s*:/g)) note(role, table, key[1], "write");
      if (body.includes("...") && role !== "service") {
        dynamicWrites.push({ relative, role, table, body });
      }
    }
  }
  for (const { role, table, column, kind } of requested) {
    const allowed = kind === "write" ? grants.write[role].get(table) : grants.read[role].get(table);
    if (!allowed?.has(column)) {
      failures.push(`${relative}: ${role} has no ${kind} grant for public.${table}.${column}`);
    }
  }
  // A spread write hides its keys, so at least require the role to hold some
  // write grant on the table rather than silently passing.
  for (const write of dynamicWrites) {
    if (!grants.write[write.role].get(write.table)?.size) {
      failures.push(`${write.relative}: ${write.role} has no write grant for public.${write.table}`);
    }
  }
}

// The primary profile editor writes through a spread object, so verify the
// validation schema itself against the UPDATE grant it depends on.
const profileRoute = join(root, "app", "api", "profile", "route.ts");
if (existsSync(profileRoute)) {
  const schema = normalize(readFileSync(profileRoute, "utf8")).match(
    /const update = z\.object\(\{([\s\S]*?)\n\}\);/,
  )?.[1];
  if (!schema) failures.push("app/api/profile/route.ts: could not locate the update validation schema");
  else {
    const writable = grants.write.authenticated.get("profiles") ?? new Set();
    for (const key of schema.matchAll(/^\s{2}(\w+):/gm)) {
      if (!writable.has(key[1])) {
        failures.push(
          `app/api/profile/route.ts: authenticated has no update grant for public.profiles.${key[1]}`,
        );
      }
    }
    if (!writable.has("updated_at")) failures.push("migration missing authenticated update grant for profiles.updated_at");
  }
}

if (failures.length) {
  console.error("Schema contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Schema contract check passed: SQL columns, RPCs, privileges, FKs, types, and TAP suites are synchronized.");
