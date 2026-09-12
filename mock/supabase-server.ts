// DEV-ONLY in-memory stand-in for Supabase, used when DEMO_MODE=true
// (see next.config.ts). This sandbox cannot reach supabase.co, so this module
// replaces `@/lib/supabase/server` and implements just enough of the
// supabase-js query builder (select / eq / in / or / order / limit / insert /
// update / upsert / delete / single / maybeSingle / count) against seeded
// in-memory tables. With real credentials the real module runs instead.
import { cookies } from "next/headers";

/* ───────────────────────────── seed data ───────────────────────────── */

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 864e5).toISOString();
const daysAhead = (d: number) => new Date(now + d * 864e5).toISOString();

const STUDENT_ID = "user_2demoStudentIBF000000000001";
const SARAH = "user_2sarahChenIBF000000000002";
const MARCUS = "user_2marcusReidIBF000000000003";
const AISHA = "user_2aishaPatelIBF000000000004";
const MAYA = "user_2mayaRaoIBF0000000000000005";
const DEV = "user_2devKhannaIBF000000000006";
const ISHITA = "user_2ishitaSenIBF000000000007";

function seedDb(): Record<string, any[]> {
  return {
  profiles: [
    {
      id: STUDENT_ID,
      email: "demo.student@ibf.dev",
      name: "Demo Student",
      role: "STUDENT",
      avatar_url: null,
      bio: "Full-stack learner looking for real startup experience.",
      skills: ["React", "TypeScript", "Product Design", "Node.js"],
      interests: ["FinTech", "Climate Tech", "EdTech"],
      portfolio_urls: [],
      availability: "10–20 hrs/week",
      engagement_preferences: [],
      company: null,
      goals: "Build real products and find a co-founder.",
      is_cofounder: false,
      average_rating: 4.8,
      endorsement_count: 3,
      suspended: false,
      created_at: daysAgo(30),
      updated_at: daysAgo(2),
    },
    {
      id: SARAH,
      email: "sarah@ecotrack.dev",
      name: "Sarah Chen",
      role: "FOUNDER",
      avatar_url: null,
      bio: "Climate-tech founder, ex-ML engineer.",
      skills: ["Python", "Machine Learning"],
      interests: ["Climate Tech"],
      portfolio_urls: [],
      availability: null,
      engagement_preferences: [],
      company: "EcoTrack AI",
      goals: " measurable climate action for small businesses.",
      is_cofounder: false,
      average_rating: 4.9,
      endorsement_count: 12,
      suspended: false,
      created_at: daysAgo(120),
      updated_at: daysAgo(5),
    },
    {
      id: MARCUS,
      email: "marcus@finflow.io",
      name: "Marcus Reid",
      role: "FOUNDER",
      avatar_url: null,
      bio: "Building smart cash-flow tools for freelancers.",
      skills: ["TypeScript", "Node.js", "PostgreSQL"],
      interests: ["FinTech"],
      portfolio_urls: [],
      availability: null,
      engagement_preferences: [],
      company: "FinFlow",
      goals: "Kill spreadsheet accounting for creatives.",
      is_cofounder: false,
      average_rating: 4.6,
      endorsement_count: 7,
      suspended: false,
      created_at: daysAgo(90),
      updated_at: daysAgo(9),
    },
    {
      id: AISHA,
      email: "aisha@neurolearn.app",
      name: "Aisha Patel",
      role: "FOUNDER",
      avatar_url: null,
      bio: "EdTech founder — personalised micro-learning.",
      skills: ["React", "AI"],
      interests: ["EdTech"],
      portfolio_urls: [],
      availability: null,
      engagement_preferences: [],
      company: "NeuroLearn",
      goals: "A personal coach for every student.",
      is_cofounder: true,
      average_rating: 4.7,
      endorsement_count: 5,
      suspended: false,
      created_at: daysAgo(60),
      updated_at: daysAgo(3),
    },
    {
      id: MAYA,
      email: "maya@ibf.dev",
      name: "Maya Rao",
      role: "STUDENT",
      avatar_url: null,
      bio: "Product designer who loves 0→1 problems.",
      skills: ["Figma", "UX Research", "Product Design"],
      interests: ["EdTech", "Climate Tech"],
      portfolio_urls: [],
      availability: "10–20 hrs/week",
      engagement_preferences: [],
      company: null,
      goals: "Design for products people love.",
      is_cofounder: false,
      average_rating: 4.9,
      endorsement_count: 8,
      suspended: false,
      created_at: daysAgo(45),
      updated_at: daysAgo(1),
    },
    {
      id: DEV,
      email: "dev@ibf.dev",
      name: "Dev Khanna",
      role: "STUDENT",
      avatar_url: null,
      bio: "Full-stack developer, shipped 3 side projects.",
      skills: ["React", "Node.js", "TypeScript"],
      interests: ["FinTech"],
      portfolio_urls: [],
      availability: "20+ hrs/week",
      engagement_preferences: [],
      company: null,
      goals: "Work on a real revenue-generating product.",
      is_cofounder: false,
      average_rating: 4.5,
      endorsement_count: 4,
      suspended: false,
      created_at: daysAgo(25),
      updated_at: daysAgo(2),
    },
    {
      id: ISHITA,
      email: "ishita@ibf.dev",
      name: "Ishita Sen",
      role: "STUDENT",
      avatar_url: null,
      bio: "ML engineer-in-training, Kaggle enthusiast.",
      skills: ["Python", "PyTorch", "Machine Learning"],
      interests: ["Climate Tech", "HealthTech"],
      portfolio_urls: [],
      availability: "5–10 hrs/week",
      engagement_preferences: [],
      company: null,
      goals: "Apply ML to real-world data problems.",
      is_cofounder: false,
      average_rating: 4.6,
      endorsement_count: 2,
      suspended: false,
      created_at: daysAgo(15),
      updated_at: daysAgo(4),
    },
  ],
  projects: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      founder_id: SARAH,
      title: "EcoTrack AI",
      description:
        "AI-powered carbon tracking for small businesses, turning messy spend data into measurable climate action. We are building the ingestion pipeline and the founder dashboard.",
      required_skills: ["Python", "Machine Learning", "React"],
      domain: "Climate Tech",
      stage: "MVP",
      engagement_type: "Equity + stipend",
      commitment_hours: 12,
      duration_weeks: 16,
      status: "OPEN",
      application_policy: "OPEN",
      created_at: daysAgo(12),
      updated_at: daysAgo(1),
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      founder_id: MARCUS,
      title: "FinFlow",
      description:
        "Smart cash-flow forecasting built for freelancers and independent creative studios. Next up: bank-feed integrations and a scenario-planning UI.",
      required_skills: ["TypeScript", "Node.js", "PostgreSQL"],
      domain: "FinTech",
      stage: "Beta",
      engagement_type: "Stipend",
      commitment_hours: 10,
      duration_weeks: 12,
      status: "OPEN",
      application_policy: "OPEN",
      created_at: daysAgo(8),
      updated_at: daysAgo(2),
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      founder_id: AISHA,
      title: "NeuroLearn",
      description:
        "Adaptive micro-learning that gives every student a personalised path and daily coaching. Help wanted on the coaching-chat UX and spaced-repetition engine.",
      required_skills: ["React", "Product Design", "AI"],
      domain: "EdTech",
      stage: "IDEA",
      engagement_type: "Equity",
      commitment_hours: 8,
      duration_weeks: 20,
      status: "OPEN",
      application_policy: "OPEN",
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
    },
  ],
  notifications: [
    {
      id: "44444444-4444-4444-8444-444444444441",
      user_id: STUDENT_ID,
      type: "MATCH",
      message: "3 new projects match your skills — check your matches",
      link: "/matches",
      is_read: false,
      created_at: daysAgo(1),
    },
    {
      id: "44444444-4444-4444-8444-444444444442",
      user_id: STUDENT_ID,
      type: "WELCOME",
      message: "Welcome to IBF! Complete your profile to improve matches.",
      link: "/settings",
      is_read: false,
      created_at: daysAgo(3),
    },
  ],
  messages: [
    {
      id: "55555555-5555-4555-8555-555555555551",
      sender_id: SARAH,
      room_type: "GENERAL",
      content: "Welcome to the IBF community chat! 👋",
      attachments: [],
      pinned: true,
      created_at: daysAgo(6),
    },
    {
      id: "55555555-5555-4555-8555-555555555552",
      sender_id: MARCUS,
      room_type: "GENERAL",
      content: "Looking for a TypeScript contributor on FinFlow — DM me.",
      attachments: [],
      pinned: false,
      created_at: daysAgo(2),
    },
    {
      id: "55555555-5555-4555-8555-555555555553",
      sender_id: AISHA,
      room_type: "GENERAL",
      content: "Our NeuroLearn demo day is next week — everyone is invited!",
      attachments: [],
      pinned: false,
      created_at: daysAgo(1),
    },
  ],
  badge_definitions: [
    {
      id: "66666666-6666-4666-8666-666666666661",
      slug: "mvp-builder",
      name: "MVP Builder",
      description: "Shipped a meaningful MVP milestone",
      icon: "rocket",
      color: "#00f5d4",
      active: true,
      created_at: daysAgo(200),
    },
    {
      id: "66666666-6666-4666-8666-666666666662",
      slug: "design-lead",
      name: "Design Lead",
      description: "Led product or visual design delivery",
      icon: "palette",
      color: "#a78bfa",
      active: true,
      created_at: daysAgo(200),
    },
    {
      id: "66666666-6666-4666-8666-666666666663",
      slug: "growth-hacker",
      name: "Growth Hacker",
      description: "Drove measurable user growth",
      icon: "trending-up",
      color: "#f59e0b",
      active: true,
      created_at: daysAgo(200),
    },
  ],
  cofounder_profiles: [
    {
      user_id: AISHA,
      vision:
        "Give every student a personal learning coach, regardless of income.",
      commitment_level: "20+ hrs/week",
      equity_expectation: "Willing to discuss meaningful equity split",
      decision_style: "Data-informed but decisive",
      working_style: {},
      values: ["Impact", "Craft", "Speed"],
      looking_for: ["Full-stack developer", "Growth marketer"],
      enabled: true,
      updated_at: daysAgo(4),
    },
  ],
  marketplace_services: [
    {
      id: "77777777-7777-4777-8777-777777777771",
      provider_id: SARAH,
      title: "ML prototype in 2 weeks",
      description:
        "I build working ML prototypes on your data so you can validate before investing in a full data team.",
      skills: ["Python", "Machine Learning"],
      pricing_note: "From ₹40,000 fixed scope",
      availability: "Weekends",
      status: "ACTIVE",
      created_at: daysAgo(10),
      updated_at: daysAgo(10),
    },
    {
      id: "77777777-7777-4777-8777-777777777772",
      provider_id: MARCUS,
      title: "FinTech product & payments audit",
      description:
        "A structured review of your payment flows, ledger design and compliance gaps with a 10-point action plan.",
      skills: ["FinTech", "Product", "Payments"],
      pricing_note: "₹25,000 per audit",
      availability: "2 slots per month",
      status: "ACTIVE",
      created_at: daysAgo(15),
      updated_at: daysAgo(15),
    },
  ],
  community_events: [
    {
      id: "88888888-8888-4888-8888-888888888881",
      host_id: AISHA,
      title: "NeuroLearn Demo Day",
      description: "See the adaptive learning prototype live and give feedback.",
      event_type: "DEMO_DAY",
      starts_at: daysAhead(6),
      ends_at: daysAhead(6),
      location: "Online",
      capacity: 100,
      status: "PUBLISHED",
      created_at: daysAgo(3),
    },
    {
      id: "88888888-8888-4888-8888-888888888882",
      host_id: SARAH,
      title: "AMA: Shipping your first climate MVP",
      description: "Ask me anything about data pipelines and early customers.",
      event_type: "AMA",
      starts_at: daysAhead(13),
      ends_at: daysAhead(13),
      location: "Online",
      capacity: 50,
      status: "PUBLISHED",
      created_at: daysAgo(1),
    },
  ],
  universities: [
    {
      id: "99999999-9999-4999-8999-999999999991",
      name: "IIT Bombay",
      domain: "iitb.ac.in",
      logo_url: null,
      active: true,
      created_at: daysAgo(300),
    },
  ],
  // Empty tables the app queries — they render as empty states.
  applications: [],
  connections: [],
  bookmarks: [],
  reviews: [],
  endorsements: [],
  milestones: [],
  meetings: [],
  meeting_attendees: [],
  team_rooms: [],
  team_members: [],
  team_tasks: [],
  message_reactions: [],
  user_badges: [],
  certificates: [],
  user_blocks: [],
  reports: [],
  event_attendees: [],
  university_members: [],
  match_actions: [],
  analytics_events: [],
  investor_inquiries: [],
  open_roles: [],
  };
}

// Next.js dev isolates module instances per route — keep one shared db on
// globalThis so every API route sees the same data.
const g = globalThis as unknown as { __ibfDemoDb?: Record<string, any[]> };
const db: Record<string, any[]> = (g.__ibfDemoDb ??= seedDb());

/* ─────────────────────── insert defaults & pk map ──────────────────── */

const insertDefaults: Record<string, () => any> = {
  profiles: () => ({
    role: "STUDENT",
    skills: [],
    interests: [],
    portfolio_urls: [],
    engagement_preferences: [],
    is_cofounder: false,
    endorsement_count: 0,
    suspended: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  projects: () => ({
    required_skills: [],
    status: "OPEN",
    application_policy: "OPEN",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  messages: () => ({
    room_type: "GENERAL",
    attachments: [],
    pinned: false,
    created_at: new Date().toISOString(),
  }),
  notifications: () => ({ is_read: false, created_at: new Date().toISOString() }),
  applications: () => ({
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  connections: () => ({
    type: "PROJECT",
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
};

const upsertKeys: Record<string, string[]> = {
  cofounder_profiles: ["user_id"],
  event_attendees: ["event_id", "user_id"],
  meeting_attendees: ["meeting_id", "user_id"],
  team_members: ["room_id", "user_id"],
  university_members: ["university_id", "user_id"],
  message_reactions: ["message_id", "user_id", "emoji"],
  user_blocks: ["blocker_id", "blocked_id"],
};

/* ───────────────────────── select parsing ──────────────────────────── */

type Field = { alias: string; column?: string; table?: string; hint?: string; children?: Field[]; count?: boolean };

function parseSelect(str: string | undefined): Field[] {
  if (!str || str === "*") return [{ alias: "*", column: "*" }];
  const out: Field[] = [];
  let depth = 0, token = "";
  const flush = () => {
    const t = token.trim();
    token = "";
    if (!t) return;
    const m = t.match(/^(?:([A-Za-z0-9_]+):)?([A-Za-z0-9_]+)(?:!([A-Za-z0-9_.]+))?(?:\((.*)\))?$/);
    if (m && m[4] !== undefined) {
      out.push({
        alias: m[1] || m[2],
        table: m[2],
        hint: m[3],
        children: m[4] === "count" ? undefined : parseSelect(m[4]),
        count: m[4] === "count",
      });
    } else {
      out.push({ alias: t, column: t });
    }
  };
  for (const ch of str) {
    if (ch === "(") { depth++; token += ch; }
    else if (ch === ")") { depth--; token += ch; }
    else if (ch === "," && depth === 0) flush();
    else token += ch;
  }
  flush();
  return out;
}

const singular = (t: string) =>
  t.endsWith("ies") ? t.slice(0, -3) + "y" : t.endsWith("s") ? t.slice(0, -1) : t;
const firstWord = (t: string) => t.split("_")[0];

function resolveEmbed(parentTable: string, parentRow: any, e: Field): any {
  const table = e.table!;
  const rows = db[table] || [];
  if (e.count) return [{ count: rows.filter((r) => childMatchesParent(table, parentTable, r, parentRow, e.hint)).length }];

  const asRelated = (r: any) => project(table, r, e.children);

  // many-to-one via explicit FK hint on the parent row
  if (e.hint && parentRow[e.hint] !== undefined) {
    const hint = e.hint;
    const hit = rows.find((r) => r.id === parentRow[hint]);
    return hit ? asRelated(hit) : null;
  }
  // many-to-one via parent column `<alias>_id`
  const fkCol = [`${e.alias}_id`, `${singular(table)}_id`].find((c) => parentRow[c] !== undefined);
  if (fkCol) {
    const hit = rows.find((r) => r.id === parentRow[fkCol]);
    return hit ? asRelated(hit) : null;
  }
  // one-to-many
  const related = rows.filter((r) => childMatchesParent(table, parentTable, r, parentRow, e.hint));
  return related.map(asRelated);
}

function childMatchesParent(childTable: string, parentTable: string, child: any, parent: any, hint?: string): boolean {
  if (hint && child[hint] !== undefined) return child[hint] === parent.id;
  const candidates = [
    `${singular(parentTable)}_id`,
    `${firstWord(parentTable)}_id`,
    `${firstWord(childTable)}_id`,
  ];
  return candidates.some((c) => child[c] !== undefined && child[c] === parent.id);
}

function project(table: string, row: any, fields?: Field[]): any {
  if (!fields) return { ...row };
  const hasStar = fields.some((f) => f.column === "*");
  const out: any = hasStar ? { ...row } : {};
  for (const f of fields) {
    if (f.column === "*") continue;
    if (f.column) out[f.alias] = row[f.column];
    else out[f.alias] = resolveEmbed(table, row, f);
  }
  return out;
}

/* ─────────────────────────── query builder ─────────────────────────── */

type Result = { data: any; error: any; count: number | null };

class Q implements PromiseLike<Result> {
  private table: string;
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private fields: Field[] | undefined;
  private payload: any = null;
  private filters: { col: string; op: string; val: any }[] = [];
  private orClauses: { col: string; op: string; val: any }[][] = [];
  private orderCols: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private countMode: "exact" | null = null;
  private headOnly = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.fields = parseSelect(columns);
    if (opts?.count) this.countMode = "exact";
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(values: any) { this.op = "insert"; this.payload = values; return this; }
  update(values: any) { this.op = "update"; this.payload = values; return this; }
  upsert(values: any) { this.op = "upsert"; this.payload = values; return this; }
  delete() { this.op = "delete"; return this; }
  rpc() { return Promise.resolve({ data: null, error: null } as Result); }

  eq(c: string, v: any) { this.filters.push({ col: c, op: "eq", val: v }); return this; }
  neq(c: string, v: any) { this.filters.push({ col: c, op: "neq", val: v }); return this; }
  gt(c: string, v: any) { this.filters.push({ col: c, op: "gt", val: v }); return this; }
  gte(c: string, v: any) { this.filters.push({ col: c, op: "gte", val: v }); return this; }
  lt(c: string, v: any) { this.filters.push({ col: c, op: "lt", val: v }); return this; }
  lte(c: string, v: any) { this.filters.push({ col: c, op: "lte", val: v }); return this; }
  in(c: string, v: any[]) { this.filters.push({ col: c, op: "in", val: v }); return this; }
  or(expr: string) {
    this.orClauses.push(
      expr.split(",").map((part) => {
        const [col, op, ...rest] = part.trim().split(".");
        return { col, op, val: rest.join(".") };
      }),
    );
    return this;
  }
  order(c: string, opts?: { ascending?: boolean }) {
    this.orderCols.push({ col: c, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  private match(row: any): boolean {
    const ok = (f: { col: string; op: string; val: any }) => {
      const v = row[f.col];
      switch (f.op) {
        case "eq": return v === f.val || (v != null && f.val != null && String(v) === String(f.val));
        case "neq": return v !== f.val;
        case "gt": return v != null && v > f.val;
        case "gte": return v != null && v >= f.val;
        case "lt": return v != null && v < f.val;
        case "lte": return v != null && v <= f.val;
        case "in": return Array.isArray(f.val) && f.val.map(String).includes(String(v));
        default: return true;
      }
    };
    if (!this.filters.every(ok)) return false;
    if (this.orClauses.length && !this.orClauses.some((group) => group.every(ok))) return false;
    return true;
  }

  private execute(): Result {
    const rows = db[this.table] ?? [];

    if (this.op === "insert" || this.op === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      const affected: any[] = [];
      for (const item of list) {
        const keys = upsertKeys[this.table];
        let existing: any = null;
        if (this.op === "upsert" && keys) {
          existing = rows.find((r) => keys.every((k) => item[k] !== undefined && String(r[k]) === String(item[k])));
        }
        const defaults = insertDefaults[this.table] ? insertDefaults[this.table]() : { created_at: new Date().toISOString() };
        if (existing) {
          Object.assign(existing, item, { updated_at: new Date().toISOString() });
          affected.push(existing);
        } else {
          const row = { id: crypto.randomUUID(), ...defaults, ...item };
          rows.push(row);
          affected.push(row);
        }
      }
      const projected = this.fields ? affected.map((r) => project(this.table, r, this.fields)) : affected;
      return { data: this.mode === "single" || this.mode === "maybe" ? (projected[0] ?? null) : projected, error: null, count: null };
    }

    if (this.op === "update") {
      const matched = rows.filter((r) => this.match(r));
      if (this.mode === "single" && matched.length === 0)
        return {
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
          count: null,
        };
      if (this.mode === "maybe" && matched.length === 0)
        return { data: null, error: null, count: null };
      for (const r of matched) Object.assign(r, this.payload);
      const projected = this.fields ? matched.map((r) => project(this.table, r, this.fields)) : matched;
      return { data: this.mode === "single" || this.mode === "maybe" ? (projected[0] ?? null) : projected, error: null, count: null };
    }

    if (this.op === "delete") {
      const keep = rows.filter((r) => !this.match(r));
      const removed = rows.filter((r) => this.match(r));
      db[this.table] = keep;
      return { data: null, error: null, count: removed.length };
    }

    // select
    let result = rows.filter((r) => this.match(r));
    const total = result.length;
    if (this.countMode && this.headOnly) return { data: null, error: null, count: total };
    for (const o of this.orderCols) {
      result = [...result].sort((a, b) => {
        const x = a[o.col], y = b[o.col];
        const cmp = x == null || y == null ? 0 : x > y ? 1 : x < y ? -1 : 0;
        return o.asc ? cmp : -cmp;
      });
    }
    if (this.limitN != null) result = result.slice(0, this.limitN);
    if (this.headOnly) return { data: null, error: null, count: total };

    const projected = this.fields ? result.map((r) => project(this.table, r, this.fields)) : result;
    if (this.mode === "single") {
      if (projected.length === 0)
        return { data: null, error: { code: "PGRST116", message: "No rows found" }, count: null };
      return { data: projected[0], error: null, count: null };
    }
    if (this.mode === "maybe") return { data: projected[0] ?? null, error: null, count: null };
    return { data: projected, error: null, count: this.countMode ? total : null };
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

/* ───────────────────────── public exports ──────────────────────────── */

/** Mirrors `createClient()` from @/lib/supabase/server — returns a fake
 *  supabase client bound to the in-memory tables. */
export async function createClient(): Promise<any> {
  return { from: (table: string) => new Q(table), auth: { signOut: async () => {} } };
}

function parseSessionValue(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Mirrors `requireUser()` — same auto-provisioning of the profiles row. */
export async function requireUser() {
  const store = await cookies();
  const session = parseSessionValue(store.get("demo_session")?.value);
  if (!session) throw new Error("UNAUTHORIZED");
  const supabase = await createClient();
  const { data: profile } = await new Q("profiles").select("id,email").eq("id", session.id).maybeSingle() as any;
  if (profile) return { supabase, user: { id: session.id, email: profile.email } };

  const name = session.name || session.email.split("@")[0] || "New member";
  const { error } = await new Q("profiles")
    .insert({ id: session.id, email: session.email, name }) as any;
  if (error && error.code !== "23505") throw error;
  return { supabase, user: { id: session.id, email: session.email } };
}
