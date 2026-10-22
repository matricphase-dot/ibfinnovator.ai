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
    "20261022030000_phase_3_3_founder_analytics_rls.sql",
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
  console.log("Connected successfully. Executing migration...");

  await client.query("BEGIN;");
  try {
    await client.query(sql);
    await client.query("COMMIT;");
    console.log("Migration 20261022030000_phase_3_3_founder_analytics_rls.sql committed cleanly!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed, rolled back:", err);
    process.exit(1);
  }

  // Verify the policy was applied
  const res = await client.query(
    "SELECT policyname, qual FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'own analytics read'"
  );
  console.log("Applied Policy Verification:", res.rows[0]);

  await client.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Error running script:", err);
  process.exit(1);
});
