import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "supabase", "PRODUCTION_SETUP_ROOT.sql");
const dest = join(root, "supabase", "migrations", "001_initial_production_schema.sql");

const content = readFileSync(src, "utf-8");
writeFileSync(dest, content, "utf-8");
console.log(`[build-setup-sql] Synchronized ${src} -> ${dest} (${content.length} bytes)`);
