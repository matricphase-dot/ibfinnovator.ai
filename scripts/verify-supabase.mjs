import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const envContent = readFileSync(envPath, "utf-8");
let supabaseUrl = "";
let serviceRoleKey = "";
let anonKey = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = trimmed.substring("NEXT_PUBLIC_SUPABASE_URL=".length).replace(/^["']|["']$/g, "");
  } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceRoleKey = trimmed.substring("SUPABASE_SERVICE_ROLE_KEY=".length).replace(/^["']|["']$/g, "");
  } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    anonKey = trimmed.substring("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length).replace(/^["']|["']$/g, "");
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log("=================================================");
console.log("🔍 SUPABASE DATABASE HEALTH VERIFICATION");
console.log("=================================================");
console.log(`Endpoint: ${supabaseUrl}`);
console.log("");

const client = createClient(supabaseUrl, serviceRoleKey);

async function runVerification() {
  const tables = [
    "profiles",
    "projects",
    "open_roles",
    "applications",
    "connections",
    "messages",
    "team_rooms",
    "team_members",
    "meetings",
    "milestones",
    "badge_definitions",
    "certificates",
    "marketplace_services",
    "community_events",
    "universities",
    "reports",
    "analytics_events",
  ];

  let missingTables = 0;
  console.log("Checking Core Database Tables...");
  for (const table of tables) {
    const { data, error } = await client.from(table).select("*").limit(1);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message} (${error.code || "ERR"})`);
      missingTables++;
    } else {
      console.log(`  ✅ ${table}: table exists and is accessible`);
    }
  }

  console.log("");
  console.log("Checking Storage Buckets...");
  const expectedBuckets = ["avatars", "resumes", "project-files", "team-files", "service-portfolios"];
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  let missingBuckets = 0;

  if (bucketError) {
    console.log(`  ❌ Failed to list buckets: ${bucketError.message}`);
    missingBuckets = expectedBuckets.length;
  } else {
    const bucketIds = new Set(buckets.map((b) => b.id));
    for (const b of expectedBuckets) {
      if (bucketIds.has(b)) {
        console.log(`  ✅ Bucket '${b}': active`);
      } else {
        console.log(`  ❌ Bucket '${b}': MISSING`);
        missingBuckets++;
      }
    }
  }

  console.log("");
  console.log("=================================================");
  if (missingTables === 0 && missingBuckets === 0) {
    console.log("🎉 ALL CHECKS PASSED! Your Supabase database is 100% production ready!");
  } else {
    console.log(`⚠️ VERIFICATION FAILED: ${missingTables} missing tables, ${missingBuckets} missing buckets.`);
    console.log("👉 ACTION REQUIRED:");
    console.log("   1. Open Supabase Dashboard -> SQL Editor (New Query)");
    console.log("   2. Paste the contents of 'supabase/PRODUCTION_SETUP_ROOT.sql'");
    console.log("   3. Click 'Run' to apply the complete schema");
    console.log("   4. Re-run 'node scripts/verify-supabase.mjs'");
  }
  console.log("=================================================");
}

runVerification();
