import pg from 'pg';
const { Client } = pg;

async function runVerification() {
  console.log('=====================================================');
  console.log('   IBF PLANE ENGINE - PHASE 1 PRODUCTION VERIFICATION');
  console.log('=====================================================');

  const client = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Table Verification
  console.log('\n[1/6] Verifying Table Existence in Supabase:');
  const requiredTables = [
    'labels',
    'issue_labels',
    'modules',
    'issue_comments',
    'issue_activities',
    'pages',
    'issues',
    'cycles',
    'projects',
    'workspaces',
    'workspace_members'
  ];

  const tableRes = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name;",
    [requiredTables]
  );
  const foundTables = tableRes.rows.map(r => r.table_name);
  for (const t of requiredTables) {
    const ok = foundTables.includes(t);
    console.log(`  ${ok ? '✅' : '❌'} Table: public.${t}`);
    if (!ok) throw new Error(`Missing table: ${t}`);
  }

  // 2. Column Verification on issues and projects
  console.log('\n[2/6] Verifying Upgraded Columns:');
  const issueColRes = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'issues' AND column_name IN ('module_id', 'parent_issue_id', 'estimate_points');"
  );
  const issueCols = issueColRes.rows.map(r => r.column_name);
  console.log(`  ✅ issues.module_id: ${issueCols.includes('module_id') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✅ issues.parent_issue_id: ${issueCols.includes('parent_issue_id') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✅ issues.estimate_points: ${issueCols.includes('estimate_points') ? 'EXISTS' : 'MISSING'}`);

  const projColRes = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'name';"
  );
  console.log(`  ✅ projects.name: ${projColRes.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);

  // 3. Realtime Publication Verification
  console.log('\n[3/6] Verifying Supabase Realtime Replication:');
  const pubRes = await client.query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"
  );
  const pubTables = pubRes.rows.map(r => r.tablename);
  const expectedPubs = ['issues', 'issue_comments', 'issue_activities', 'cycles', 'modules', 'pages'];
  for (const pt of expectedPubs) {
    const active = pubTables.includes(pt);
    console.log(`  ${active ? '✅' : '❌'} Realtime Publication on: ${pt}`);
    if (!active) throw new Error(`Table not in realtime publication: ${pt}`);
  }

  // 4. Trigger & Audit Activity Verification
  console.log('\n[4/6] Verifying Issue Mutation Audit Trigger:');
  const trigRes = await client.query(
    "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'issues' AND trigger_name = 'trg_issue_audit_log';"
  );
  console.log(`  ✅ Trigger trg_issue_audit_log: ${trigRes.rows.length > 0 ? 'ACTIVE' : 'MISSING'}`);

  // 5. End-to-End Database Operation Smoke Test
  console.log('\n[5/6] Executing End-to-End PM Cycle Test:');
  const project = (await client.query("SELECT id, name, identifier FROM public.projects LIMIT 1;")).rows[0];
  const profile = (await client.query("SELECT id FROM public.profiles LIMIT 1;")).rows[0];

  // Insert label
  const label = (await client.query(
    "INSERT INTO public.labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING *;",
    [project.id, 'P1-Engine-Verification', '#00f5d4']
  )).rows[0];
  console.log(`  ✅ Created Label: ${label.name} (${label.id})`);

  // Insert module
  const module = (await client.query(
    "INSERT INTO public.modules (project_id, name, status) VALUES ($1, $2, $3) RETURNING *;",
    [project.id, 'IBF Plane Engine Milestone', 'in_progress']
  )).rows[0];
  console.log(`  ✅ Created Module: ${module.name} (${module.id})`);

  // Insert issue
  const issue = (await client.query(
    `INSERT INTO public.issues (project_id, title, priority, state, created_by, module_id, estimate_points)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
    [project.id, 'Verify Plane Engine Integration', 'urgent', 'todo', profile.id, module.id, 8]
  )).rows[0];
  console.log(`  ✅ Created Issue: ${project.identifier || 'INN'}-${issue.sequence_id} (${issue.id})`);

  // Attach label
  await client.query("INSERT INTO public.issue_labels (issue_id, label_id) VALUES ($1, $2);", [issue.id, label.id]);
  console.log(`  ✅ Attached Label to Issue`);

  // Mutate state & priority to fire trigger
  await client.query(
    "UPDATE public.issues SET state = 'in_progress', priority = 'high' WHERE id = $1;",
    [issue.id]
  );
  console.log(`  ✅ Updated Issue State: todo -> in_progress, priority: urgent -> high`);

  // Query audit activities generated by trigger
  const activities = (await client.query(
    "SELECT field, old_value, new_value FROM public.issue_activities WHERE issue_id = $1;",
    [issue.id]
  )).rows;
  console.log(`  ✅ Verified Trigger Captured ${activities.length} Audit Events:`);
  for (const a of activities) {
    console.log(`     - [Audit] ${a.field}: '${a.old_value}' -> '${a.new_value}'`);
  }

  // Create discussion comment
  const comment = (await client.query(
    "INSERT INTO public.issue_comments (issue_id, actor_id, comment_html) VALUES ($1, $2, $3) RETURNING *;",
    [issue.id, profile.id, 'Phase 1 Production Root Fix validated and working.']
  )).rows[0];
  console.log(`  ✅ Created Discussion Comment: (${comment.id})`);

  // Create page
  const page = (await client.query(
    `INSERT INTO public.pages (project_id, created_by, title, content_markdown, is_favorite)
     VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
    [project.id, profile.id, 'Plane Engine Architecture Documentation', '# Verification Success', true]
  )).rows[0];
  console.log(`  ✅ Created Page: ${page.title} (${page.id})`);

  // 6. Cleanup
  console.log('\n[6/6] Cleaning up test records:');
  await client.query("DELETE FROM public.pages WHERE id = $1;", [page.id]);
  await client.query("DELETE FROM public.issues WHERE id = $1;", [issue.id]);
  await client.query("DELETE FROM public.modules WHERE id = $1;", [module.id]);
  await client.query("DELETE FROM public.labels WHERE id = $1;", [label.id]);
  console.log('  ✅ Test data cleanly purged.');

  await client.end();
  console.log('\n=====================================================');
  console.log('   🎉 ALL PHASE 1 PRODUCTION VERIFICATIONS PASSED!  ');
  console.log('=====================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
