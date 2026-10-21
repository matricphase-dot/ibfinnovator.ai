import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20261021000000_ibf_plane_engine_phase1.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL pooler...');
  await client.connect();
  console.log('Connected.');

  console.log('Applying Phase 1 IBF Plane Engine Migration...');
  await client.query(sql);
  console.log('Migration executed successfully!');

  // Verify created tables
  const expectedTables = ['labels', 'issue_labels', 'modules', 'issue_comments', 'issue_activities', 'pages'];
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name;",
    [expectedTables]
  );
  console.log('Verified Newly Created Tables:', res.rows.map(r => r.table_name));

  // Verify columns on issues
  const colRes = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'issues' AND column_name IN ('module_id', 'parent_issue_id', 'estimate_points');"
  );
  console.log('Verified Issues Columns:', colRes.rows.map(r => r.column_name));

  // Verify projects.name column
  const projColRes = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'name';"
  );
  console.log('Verified Projects Name Column:', projColRes.rows.map(r => r.column_name));

  // Verify Realtime publication
  const pubRes = await client.query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = ANY($1);",
    [['issues', 'issue_comments', 'issue_activities', 'cycles', 'modules', 'pages']]
  );
  console.log('Verified Realtime Publication Tables:', pubRes.rows.map(r => r.tablename));

  // Verify trigger
  const trigRes = await client.query(
    "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'issues' AND trigger_name = 'trg_issue_audit_log';"
  );
  console.log('Verified Audit Trigger:', trigRes.rows.map(r => r.trigger_name));

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
