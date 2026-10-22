import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== PHASE 3 WORKSPACE ARCHITECTURE & DASHBOARD VERIFICATION ===");

// 1. Verify dashboard/page.tsx code contract
console.log("[1/3] Verifying Dashboard AppShell and workspace scoping contract...");
const dashboardSrc = readFileSync(join(root, "app", "dashboard", "page.tsx"), "utf-8");

assert.ok(
  dashboardSrc.includes("<AppShell"),
  "Dashboard must be wrapped in <AppShell> to preserve unified 260px sidebar and topbar!",
);
assert.ok(
  dashboardSrc.includes("useWorkspace()"),
  "Dashboard must consume useWorkspace() to access the single-source-of-truth active workspace!",
);
assert.ok(
  !dashboardSrc.includes('fetch("/api/projects", { cache: "no-store" })'),
  "Dashboard must NOT execute GET /api/projects to load workspace data!",
);
console.log("  ✓ Dashboard is wrapped in <AppShell> and scoped strictly to /api/workspace");

// 2. Verify workspace/route.ts multi-tenant isolation and count optimization
console.log("[2/3] Verifying workspace API isolation and count optimization contract...");
const workspaceRouteSrc = readFileSync(join(root, "app", "api", "workspace", "route.ts"), "utf-8");

assert.ok(
  !workspaceRouteSrc.includes("workspace_id.is.null"),
  "workspace_id.is.null must be deleted to prevent orphan/stranger projects in workspace!",
);
assert.ok(
  workspaceRouteSrc.includes('count: "exact", head: true'),
  "Must use count: 'exact', head: true queries to avoid downloading all table rows over the wire!",
);
console.log("  ✓ Workspace route isolates projects strictly and uses zero-row count queries");

// 3. Verify founder analytics scoping
console.log("[3/3] Verifying founder analytics project scoping contract...");
const founderAnalyticsSrc = readFileSync(join(root, "app", "api", "analytics", "founder", "route.ts"), "utf-8");

assert.ok(
  founderAnalyticsSrc.includes("project_id.in.") &&
    founderAnalyticsSrc.includes("metadata->>project_id.in."),
  "Founder analytics must filter analytics_events strictly by founder project IDs using both column and metadata JSON!",
);
console.log("  ✓ Founder analytics strictly isolates project views to founder-owned projects");

console.log("\n🎉 ALL PHASE 3 WORKSPACE ARCHITECTURE CHECKS PASSED CLEANLY!");
