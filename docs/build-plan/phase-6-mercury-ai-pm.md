# Phase 6: Inception Labs Mercury 2.5 AI PM Assistant
> **Status:** Planning · Ponytail Strict: OpenAI SDK compatibility, drop-in function calling  
> **Target:** Inception Labs Mercury 2.5 integration for instant (<1s) natural language project management.

---

## 1. Mercury 2.5 Client Setup
```typescript
import OpenAI from 'openai';

export const mercury = new OpenAI({
  apiKey: process.env.MERCURY_API_KEY,
  baseURL: 'https://api.inceptionlabs.ai/v1',
});
```

---

## 2. Function Calling Tool Definitions
Allow Mercury 2.5 to execute PM actions directly via structured JSON outputs:
- `create_issue({ title, description, priority, assignee, due_date })`
- `update_issue_state({ issue_id, state })`
- `summarize_cycle({ cycle_id })`
- `suggest_next_sprint_tasks({ project_id })`

---

## 3. UI Assistant Interface
- Quick Command Bar (`Cmd+K` / `Ctrl+K`) inside the Project workspace.
- Chat Assistant Drawer in project view for natural language sprint planning:
  - *"Create 3 issues for user authentication with high priority and assign them to Alex."*
  - *"What are the blocker tasks in the current sprint?"*
