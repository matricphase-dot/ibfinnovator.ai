# Phase 1: Database Schema & Supabase Migrations
> **Status:** ✅ **COMPLETED & VERIFIED** · Ponytail Strict: Minimal clean schema, 100% type-safe  
> **Results:** Workspaces, Projects, Cycles, Issues, Channels, Messages migrated; RLS enforced; Realtime enabled; Types generated.

---

## 1. Schema Specifications

### 1.1 Profiles & Roles
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('founder', 'student', 'employee')),
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  links JSONB DEFAULT '[]'::jsonb, -- Array of { title: string, url: string, icon?: string }
  skills TEXT[] DEFAULT '{}',
  startup_name TEXT,
  startup_stage TEXT,
  education TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Workspaces & Membership
```sql
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);
```

### 1.3 Projects & Cycles (Sprints)
```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  identifier TEXT NOT NULL, -- e.g. "INN"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, identifier)
);

CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 Issues / Tasks (Plane Open-Source Pattern)
```sql
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  sequence_id INT NOT NULL, -- Auto-incrementing per project (INN-1, INN-2)
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  state TEXT NOT NULL DEFAULT 'backlog' CHECK (state IN ('backlog', 'todo', 'in_progress', 'done', 'canceled')),
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, sequence_id)
);
```

### 1.5 Real-time Chat: Channels & Messages (Mattermost Pattern)
```sql
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE, -- For Slack/Mattermost threads
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS) Rules
- Enable RLS on ALL tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Users can only read/write workspaces, projects, issues, channels, and messages if they are active members in `workspace_members`.
- Public portfolio reads: `SELECT ON profiles WHERE is_published = true` is open to `anon`.
- Profile mutations: `UPDATE ON profiles` restricted strictly to `auth.uid() = id`.

---

## 3. Migration Execution & Verification
1. Place SQL migration in `supabase/migrations/20261016000000_core_mvp_schema.sql`.
2. Apply using Supabase CLI:
```bash
npx supabase db push
```
3. Generate TypeScript types:
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```
