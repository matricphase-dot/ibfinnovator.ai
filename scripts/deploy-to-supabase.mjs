import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.local");
const content = readFileSync(envFile, "utf-8");

let databaseUrl = "";
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    databaseUrl = trimmed.substring("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

console.log("Found DATABASE_URL. Connecting to Supabase database...");

const child = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--file", "./supabase/PRODUCTION_SETUP_ROOT.sql", "--schema", "./prisma/schema.prisma"],
  {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  }
);

if (child.status === 0) {
  console.log("SUCCESS! Database setup completed successfully.");
} else {
  console.error("Failed with code:", child.status);
  process.exit(child.status || 1);
}
