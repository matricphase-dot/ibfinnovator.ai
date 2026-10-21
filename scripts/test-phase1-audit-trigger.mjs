import pg from 'pg';
const { Client } = pg;

async function test() {
  const client = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Testing Phase 1 Data Operations & Trigger...');

  // 1. Get or create a sample project and user
  const projRes = await client.query("SELECT id, name, title FROM public.projects LIMIT 1;");
  if (projRes.rows.length === 0) {
    console.log('No project found to test. Skipping trigger smoke test.');
    await client.end();
    return;
  }
  const project = projRes.rows[0];
  console.log('Testing with project:', project.id, project.name || project.title);

  const profileRes = await client.query("SELECT id FROM public.profiles LIMIT 1;");
  const profileId = profileRes.rows[0]?.id;

  // 2. Insert a Label
  const labelRes = await client.query(
    "INSERT INTO public.labels (project_id, name, color, description) VALUES ($1, $2, $3, $4) RETURNING *;",
    [project.id, 'Frontend', '#00f5d4', 'Frontend UI tasks']
  );
  console.log('✅ Label created:', labelRes.rows[0].id, labelRes.rows[0].name);

  // 3. Insert a Module (Epic)
  const moduleRes = await client.query(
    "INSERT INTO public.modules (project_id, name, description, status) VALUES ($1, $2, $3, $4) RETURNING *;",
    [project.id, 'Core Authentication Engine', 'Multi-tenant auth & roles', 'in_progress']
  );
  console.log('✅ Module created:', moduleRes.rows[0].id, moduleRes.rows[0].name);

  // 4. Insert an Issue linked to Module
  const issueRes = await client.query(
    `INSERT INTO public.issues (project_id, title, description, priority, state, created_by, module_id, estimate_points)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`,
    [project.id, 'Test Phase 1 Issue', 'Verification of DB schema', 'high', 'todo', profileId, moduleRes.rows[0].id, 5]
  );
  const issue = issueRes.rows[0];
  console.log('✅ Issue created:', issue.id, `Sequence: ${issue.sequence_id}`, `Module: ${issue.module_id}`, `Points: ${issue.estimate_points}`);

  // 5. Link Issue to Label
  await client.query(
    "INSERT INTO public.issue_labels (issue_id, label_id) VALUES ($1, $2);",
    [issue.id, labelRes.rows[0].id]
  );
  console.log('✅ Issue label linked');

  // 6. Test Trigger by updating issue state from 'todo' to 'in_progress'
  console.log('Updating issue state to test audit trigger...');
  await client.query(
    "UPDATE public.issues SET state = 'in_progress', priority = 'urgent' WHERE id = $1;",
    [issue.id]
  );

  // Check issue_activities
  const actRes = await client.query(
    "SELECT field, old_value, new_value, created_at FROM public.issue_activities WHERE issue_id = $1 ORDER BY created_at ASC;",
    [issue.id]
  );
  console.log(`✅ Audit trigger captured ${actRes.rows.length} activities:`);
  for (const act of actRes.rows) {
    console.log(`   - Field: ${act.field} | ${act.old_value} -> ${act.new_value}`);
  }

  // 7. Insert an Issue Comment
  const commentRes = await client.query(
    "INSERT INTO public.issue_comments (issue_id, actor_id, comment_html) VALUES ($1, $2, $3) RETURNING *;",
    [issue.id, profileId, '<p>This is a real-time discussion test comment.</p>']
  );
  console.log('✅ Comment created:', commentRes.rows[0].id);

  // 8. Insert a Page (PRD Doc)
  const pageRes = await client.query(
    `INSERT INTO public.pages (project_id, created_by, title, content_markdown, is_favorite)
     VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
    [project.id, profileId, 'Phase 1 PRD & Architecture Spec', '# Phase 1 Done\n\nAll tables and triggers are active.', true]
  );
  console.log('✅ Page created:', pageRes.rows[0].id, pageRes.rows[0].title);

  // 9. Clean up test records
  console.log('Cleaning up test records...');
  await client.query("DELETE FROM public.pages WHERE id = $1;", [pageRes.rows[0].id]);
  await client.query("DELETE FROM public.issues WHERE id = $1;", [issue.id]);
  await client.query("DELETE FROM public.modules WHERE id = $1;", [moduleRes.rows[0].id]);
  await client.query("DELETE FROM public.labels WHERE id = $1;", [labelRes.rows[0].id]);
  console.log('✅ Cleanup completed cleanly!');

  await client.end();
}

test().catch(err => {
  console.error('Trigger smoke test failed:', err);
  process.exit(1);
});
