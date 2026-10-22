import assert from "node:assert";
import { getActiveWorkspace } from "../lib/workspace.ts";

console.log("=== PHASE 2.1 MULTI-TENANT WORKSPACE ISOLATION SUITE ===");

// 1. Mock Supabase Client Helper
function createMockSupabase(scenario) {
  return {
    from: (table) => ({
      select: (fields) => ({
        eq: (col1, val1) => ({
          eq: (col2, val2) => ({
            maybeSingle: async () => {
              if (scenario.getPreferredMembership) {
                return scenario.getPreferredMembership(table, col1, val1, col2, val2);
              }
              return { data: null, error: null };
            },
          }),
          order: () => ({
            limit: () => ({
              maybeSingle: async () => {
                if (scenario.getExisting) {
                  return scenario.getExisting(table, col1, val1);
                }
                return { data: null, error: null };
              },
            }),
          }),
          maybeSingle: async () => {
            if (scenario.getSingle) {
              return scenario.getSingle(table, col1, val1);
            }
            return { data: null, error: null };
          },
        }),
      }),
      insert: (record) => ({
        select: () => ({
          maybeSingle: async () => {
            if (scenario.insert) {
              return scenario.insert(table, record);
            }
            return { data: { id: "new-ws-id", ...record }, error: null };
          },
          single: async () => {
            if (scenario.insert) {
              return scenario.insert(table, record);
            }
            return { data: { id: "new-ws-id", ...record }, error: null };
          },
        }),
      }),
      upsert: async (record) => {
        if (scenario.upsert) {
          return scenario.upsert(table, record);
        }
        return { data: record, error: null };
      },
    }),
  };
}

async function runTests() {
  const userId = "usr-12345-abcde";

  // Test 1: User has existing membership -> Returns that workspace
  console.log("[1/5] Testing existing workspace membership retrieval...");
  const mockExisting = createMockSupabase({
    getExisting: (table, col, val) => {
      if (table === "workspace_members" && col === "user_id" && val === userId) {
        return {
          data: {
            workspace: {
              id: "ws-existing-1",
              name: "Existing Team Workspace",
              slug: "existing-team",
              owner_id: userId,
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
  });

  const ws1 = await getActiveWorkspace(mockExisting, userId);
  assert.strictEqual(ws1?.id, "ws-existing-1");
  assert.strictEqual(ws1?.name, "Existing Team Workspace");
  console.log("  ✓ Successfully resolved existing membership workspace");

  // Test 2: Attacker requests a foreign workspace ID -> Denied and falls back safely
  console.log("[2/5] Testing foreign workspace hijack prevention (attacker provides foreign ID)...");
  let createAttempted = false;
  const mockHijackAttempt = createMockSupabase({
    getPreferredMembership: () => ({ data: null, error: null }), // Not a member of requested
    getSingle: (table, col, val) => {
      if (table === "workspaces" && val === "foreign-ws-id") {
        return { data: null, error: null }; // Not owner
      }
      if (table === "profiles") {
        return { data: { name: "Alice", username: "alice" }, error: null };
      }
      return { data: null, error: null };
    },
    getExisting: () => ({ data: null, error: null }),
    insert: (table, record) => {
      if (table === "workspaces") {
        createAttempted = true;
        return { data: { id: "alice-ws-id", ...record }, error: null };
      }
      return { data: null, error: null };
    },
  });

  const ws2 = await getActiveWorkspace(mockHijackAttempt, userId, "foreign-ws-id");
  assert.notStrictEqual(ws2?.id, "foreign-ws-id", "Must NEVER return foreign workspace!");
  assert.strictEqual(ws2?.id, "alice-ws-id");
  assert.ok(createAttempted, "Must safely create isolated workspace for Alice");
  console.log("  ✓ Foreign workspace access denied; isolated personal workspace created instead");

  // Test 3: Concurrent race condition simulation (two parallel requests create workspace)
  console.log("[3/5] Testing concurrent race condition handling on initial signup...");
  let recheckQueried = false;
  const mockRaceCondition = createMockSupabase({
    getExisting: (table, col, val) => {
      // On second check after insert fails, return the workspace created by parallel request
      if (recheckQueried && table === "workspaces" && col === "owner_id" && val === userId) {
        return {
          data: {
            id: "race-winner-ws-id",
            name: "Alice's Workspace",
            slug: "alice-ws-winner",
            owner_id: userId,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
    getSingle: (table) => {
      if (table === "profiles") {
        return { data: { name: "Alice", username: "alice" }, error: null };
      }
      return { data: null, error: null };
    },
    insert: (table) => {
      if (table === "workspaces") {
        // First insert fails due to race condition (duplicate key)
        recheckQueried = true;
        return {
          data: null,
          error: { code: "23505", message: "duplicate key value violates unique constraint" },
        };
      }
      return { data: null, error: null };
    },
  });

  const ws3 = await getActiveWorkspace(mockRaceCondition, userId);
  assert.strictEqual(ws3?.id, "race-winner-ws-id", "Must recover cleanly from race condition!");
  console.log("  ✓ Race condition handled cleanly: parallel created workspace returned without error");

  // Test 4: Slug collision with another user's slug -> Retry with entropy succeeds
  console.log("[4/5] Testing slug collision retry with high entropy...");
  let insertAttempts = 0;
  const mockSlugCollision = createMockSupabase({
    getExisting: () => ({ data: null, error: null }),
    getSingle: (table) => {
      if (table === "profiles") {
        return { data: { name: "Bob", username: "bob" }, error: null };
      }
      return { data: null, error: null };
    },
    insert: (table, record) => {
      if (table === "workspaces") {
        insertAttempts++;
        if (insertAttempts === 1) {
          // Slug was taken by someone else
          return { data: null, error: { code: "23505", message: "slug taken" } };
        }
        // Retry succeeds
        return { data: { id: "bob-retry-ws", ...record }, error: null };
      }
      return { data: null, error: null };
    },
  });

  const ws4 = await getActiveWorkspace(mockSlugCollision, "usr-bob");
  assert.strictEqual(ws4?.id, "bob-retry-ws");
  assert.strictEqual(insertAttempts, 2, "Must retry with entropy on slug collision");
  console.log("  ✓ Collision retry succeeded; unique slug generated");

  // Test 5: Verify default #general channel creation on new workspace
  console.log("[5/5] Testing default #general channel initialization on new workspace...");
  let channelCreated = false;
  const mockChannelCreation = createMockSupabase({
    getExisting: () => ({ data: null, error: null }),
    getSingle: (table) => {
      if (table === "profiles") return { data: { name: "Charlie" }, error: null };
      return { data: null, error: null };
    },
    insert: (table, record) => {
      if (table === "workspaces") {
        return { data: { id: "charlie-ws", ...record }, error: null };
      }
      if (table === "channels") {
        if (record.name === "general" && record.workspace_id === "charlie-ws") {
          channelCreated = true;
        }
        return { data: { id: "gen-ch-id", ...record }, error: null };
      }
      return { data: null, error: null };
    },
  });

  const ws5 = await getActiveWorkspace(mockChannelCreation, "usr-charlie");
  assert.strictEqual(ws5?.id, "charlie-ws");
  assert.ok(channelCreated, "#general channel must be created on new workspace!");
  console.log("  ✓ Default #general channel created and linked to workspace");

  console.log("\n🎉 ALL 5 PHASE 2.1 MULTI-TENANT WORKSPACE ISOLATION TESTS PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
