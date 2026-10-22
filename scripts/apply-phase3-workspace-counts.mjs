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
    "20261022020000_phase_3_2_workspace_project_counts.sql",
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

  console.log("Applying Phase 3.2 Workspace Project Counts RPC...");
  await client.query("BEGIN;");
  try {
    await client.query(sql);
    await client.query("COMMIT;");
    console.log("Phase 3.2 Workspace Project Counts RPC committed successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  }

  // Verification: Test calling the RPC on live DB
  const testRes = await client.query(
    "SELECT * FROM public.get_workspace_project_counts(ARRAY['19c478b8-be57-4d6f-b4fd-d919396e58d0']::uuid[]);",
  );
  console.log("Verified RPC output on sample project:", testRes.rows);

  await client.end();
}

main().catch((err) => {
  console.error("Migration execution failed:", err);
  process.exit(1);
});
