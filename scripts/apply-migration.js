const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20261016000000_core_mvp_schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const c = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase...');
  await c.connect();
  console.log('Applying migration...');
  await c.query(sql);
  console.log('Migration executed successfully!');

  // Verify created tables
  const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('workspaces', 'workspace_members', 'projects', 'cycles', 'issues', 'channels', 'channel_members', 'messages') ORDER BY table_name;");
  console.log('VERIFIED TABLES:', res.rows.map(r => r.table_name));

  await c.end();
}

main().catch(err => {
  console.error('MIGRATION FAILED:', err);
  process.exit(1);
});
