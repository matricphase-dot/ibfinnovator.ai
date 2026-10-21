import pg from 'pg';
const { Client } = pg;

async function test() {
  const c = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  await c.connect();
  const pubRes = await c.query("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';");
  console.log('Tables currently in supabase_realtime:', pubRes.rows.map(r => r.tablename));
  
  const projectsCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND table_schema = 'public';");
  console.log('projects table columns:', projectsCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  
  const profilesCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';");
  console.log('profiles table columns:', profilesCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  const sampleProject = await c.query("SELECT id, name, identifier FROM public.projects LIMIT 3;");
  console.log('Sample projects:', sampleProject.rows);

  await c.end();
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
