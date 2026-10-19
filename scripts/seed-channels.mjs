import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env.local'));

async function seed() {
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Get an owner profile
    const { rows: profiles } = await client.query('SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1');
    if (!profiles.length) {
      console.log('No profiles found in DB');
      return;
    }
    const ownerId = profiles[0].id;

    // 2. Check if default community workspace exists
    const { rows: ws } = await client.query('SELECT id, name, slug FROM public.workspaces WHERE slug = $1', ['ibf-community']);
    let workspaceId;
    if (!ws.length) {
      const ins = await client.query(
        'INSERT INTO public.workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id',
        ['IBF Community', 'ibf-community', ownerId]
      );
      workspaceId = ins.rows[0].id;
      console.log('Created IBF Community workspace:', workspaceId);
    } else {
      workspaceId = ws[0].id;
      console.log('IBF Community workspace exists:', workspaceId);
    }

    // 3. Add all profiles as workspace members
    await client.query(
      `INSERT INTO public.workspace_members (workspace_id, user_id, role)
       SELECT $1, id, 'member' FROM public.profiles
       ON CONFLICT (workspace_id, user_id) DO NOTHING`,
      [workspaceId]
    );
    await client.query(
      `UPDATE public.workspace_members SET role = 'owner' WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, ownerId]
    );

    // 4. Create default channels: general, announcements, ideas-and-projects, random
    const defaultChannels = [
      { name: 'general', description: 'General community discussion and team collaboration', is_private: false },
      { name: 'announcements', description: 'Official announcements and platform updates', is_private: false },
      { name: 'ideas-and-projects', description: 'Brainstorm startups, share project updates, and find co-founders', is_private: false },
      { name: 'random', description: 'Casual chats, coffee talks, and sharing cool links', is_private: false },
    ];

    for (const c of defaultChannels) {
      const chRes = await client.query(
        `INSERT INTO public.channels (workspace_id, name, description, is_private, created_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (workspace_id, name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [workspaceId, c.name, c.description, c.is_private, ownerId]
      );
      console.log('Channel ready:', chRes.rows[0]);
    }

    // 5. Link any projects with null workspace_id to this default workspace
    await client.query('UPDATE public.projects SET workspace_id = $1 WHERE workspace_id IS NULL', [workspaceId]);
    console.log('Linked projects to default workspace successfully!');

  } catch (err) {
    console.error('Seed script error:', err);
  } finally {
    await client.end();
  }
}

seed();
