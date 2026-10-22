import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sqlFile = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20261022000000_phase_1_security_root_fix.sql",
  );
  const sql = fs.readFileSync(sqlFile, "utf8");

  const client = new Client({
    user: "postgres.omfcpzfcjgqqiyvwuyzu",
    password: "Jatin9594@&",
    host: "aws-0-ap-south-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase PostgreSQL pooler...");
  await client.connect();
  console.log("Connected successfully.");

  console.log("Applying Phase 1 Security Root Fix Migration...");
  await client.query("BEGIN;");
  try {
    await client.query(sql);
    await client.query("COMMIT;");
    console.log("Phase 1 Security Root Fix Migration committed successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  }

  // Verification 1: Functions
  const funcRes = await client.query(
    "SELECT proname FROM pg_proc WHERE proname IN ('is_workspace_member', 'can_access_channel', 'set_issue_sequence_id');",
  );
  console.log("Verified RPC Functions:", funcRes.rows.map((r) => r.proname));

  // Verification 2: Check constraints
  const conRes = await client.query(
    "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'messages_room_type_check';",
  );
  console.log("Verified Check Constraint:", conRes.rows);

  // Verification 3: Active Policies
  const polRes = await client.query(
    "SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('pages', 'workspace_members', 'channels', 'issues', 'messages') ORDER BY tablename, policyname;",
  );
  console.log("Verified Active Security Policies Count:", polRes.rows.length);

  await client.end();
}

main().catch((err) => {
  console.error("Migration execution failed:", err);
  process.exit(1);
});
