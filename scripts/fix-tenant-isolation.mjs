import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({
    user: 'postgres.omfcpzfcjgqqiyvwuyzu',
    password: 'Jatin9594@&',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('Connected to Supabase PostgreSQL database.');

  // 1. Create personal workspace for shipsprint if not exists
  const shipsprintId = '87960aff-b5b3-4845-81d2-fd8e521ad980';
  const shipsprintWsCheck = await client.query('SELECT id FROM workspaces WHERE owner_id = $1;', [shipsprintId]);

  let shipsprintWsId;
  if (shipsprintWsCheck.rows.length === 0) {
    const wsRes = await client.query(
      "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id;",
      ["shipsprint's Workspace", "shipsprint", shipsprintId]
    );
    shipsprintWsId = wsRes.rows[0].id;
    console.log("Created workspace for shipsprint:", shipsprintWsId);

    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;",
      [shipsprintWsId, shipsprintId, "owner"]
    );
  } else {
    shipsprintWsId = shipsprintWsCheck.rows[0].id;
    console.log("shipsprint workspace exists:", shipsprintWsId);
  }

  // 2. Link shipsprint's project to their workspace and ensure title/name
  await client.query(
    "UPDATE projects SET workspace_id = $1, name = COALESCE(name, title, 'Innovator Project') WHERE founder_id = $2 AND workspace_id IS NULL;",
    [shipsprintWsId, shipsprintId]
  );

  // 3. Make sure shipsprint is removed from ibf-community membership if any
  await client.query(
    "DELETE FROM workspace_members WHERE user_id = $1 AND workspace_id = 'c28da043-0eeb-4d64-acc5-f5babf1f33a7';",
    [shipsprintId]
  );

  // 4. Also isolate rupnbhattacharya
  const rupnId = '0584fe07-cb9e-4ef6-a268-29d4aea3ab07';
  const rupnWsCheck = await client.query('SELECT id FROM workspaces WHERE owner_id = $1;', [rupnId]);
  let rupnWsId;
  if (rupnWsCheck.rows.length === 0) {
    const wsRes = await client.query(
      "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id;",
      ["rupn's Workspace", "rupn", rupnId]
    );
    rupnWsId = wsRes.rows[0].id;
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;",
      [rupnWsId, rupnId, "owner"]
    );
    console.log("Created workspace for rupn:", rupnWsId);
  } else {
    rupnWsId = rupnWsCheck.rows[0].id;
  }
  await client.query(
    "UPDATE projects SET workspace_id = $1, name = COALESCE(name, title, 'Innovator Project') WHERE founder_id = $2 AND workspace_id IS NULL;",
    [rupnWsId, rupnId]
  );

  // Verify final state
  const allWs = await client.query("SELECT id, name, slug, owner_id FROM workspaces;");
  console.log("Final workspaces:", allWs.rows);
  const allProjects = await client.query("SELECT id, name, founder_id, workspace_id FROM projects;");
  console.log("Final projects:", allProjects.rows);
  const allMembers = await client.query("SELECT workspace_id, user_id, role FROM workspace_members;");
  console.log("Final members:", allMembers.rows);

  await client.end();
  console.log("Multi-tenant isolation fix completed successfully.");
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
