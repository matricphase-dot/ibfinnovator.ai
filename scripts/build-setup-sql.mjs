import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootPath = join(root, "supabase", "PRODUCTION_SETUP_ROOT.sql");
const migrationsPath = join(root, "supabase", "migrations");
const migrationPath = join(migrationsPath, "20260924000000_reconcile_production_contract.sql");
const normalize = (value) => value.replaceAll("\r\n", "\n").trim();
const rootSql = normalize(readFileSync(rootPath, "utf8"));
const migrationSql = normalize(readFileSync(migrationPath, "utf8"));
const baselineSql = normalize(readFileSync(join(migrationsPath, "001_initial_production_schema.sql"), "utf8"));
const marker = "-- =============================================================================\n-- END OF CANONICAL PRODUCTION DATABASE SETUP\n-- =============================================================================";
const rootMarkerEnd = rootSql.indexOf(marker) + marker.length;
const rootPrefix = rootSql.slice(rootSql.indexOf("\n") + 1, rootMarkerEnd).trim();
const migrationSuffix = migrationSql.replace(/^begin;\s*/, "").trim();
const rootSuffix = rootSql.slice(rootSql.indexOf("create extension if not exists pgcrypto;", rootMarkerEnd)).trim();
const migrationFiles = readdirSync(migrationsPath).filter((name) => name.endsWith(".sql"));

if (rootPrefix !== baselineSql) {
  throw new Error("001_initial_production_schema.sql is not synchronized with the root baseline prefix");
}
if (rootSuffix !== migrationSuffix) {
  throw new Error("The production root artifact is not synchronized with the forward migration");
}
if (!rootSql.startsWith("begin;") || !rootSql.endsWith("notify pgrst, 'reload schema';\ncommit;")) {
  throw new Error("The production root artifact is missing its final transaction or schema-cache reload");
}
for (const name of migrationFiles) {
  const sql = normalize(readFileSync(join(migrationsPath, name), "utf8"));
  if (/grant all on all (?:tables|routines|sequences) in schema public to anon, authenticated/.test(sql)) {
    throw new Error(`${name} grants broad API-role access`);
  }
  if (/alter default privileges in schema public grant all on (?:tables|routines|sequences) to anon, authenticated/.test(sql)) {
    throw new Error(`${name} grants broad default API-role access`);
  }
}
console.log(`[build-setup-sql] Verified ${migrationFiles.length} migrations, baseline parity, and the root artifact.`);
