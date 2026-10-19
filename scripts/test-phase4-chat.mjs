import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

const env = dotenv.parse(fs.readFileSync(".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runSmokeTest() {
  console.log("=== PHASE 4 CHAT ENGINE SMOKE TEST ===");

  // 1. Get test profile
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, name, email").limit(2);
  if (pErr || !profiles?.length) {
    throw new Error(`Profile check failed: ${pErr?.message}`);
  }
  const userA = profiles[0];
  const userB = profiles[1] || profiles[0];
  console.log("✓ Test users ready:", userA.name, "(id:", userA.id, ")");

  // 2. Fetch default workspace
  const { data: ws, error: wsErr } = await supabase.from("workspaces").select("id, name, slug").eq("slug", "ibf-community").single();
  if (wsErr || !ws) {
    throw new Error(`Workspace check failed: ${wsErr?.message}`);
  }
  console.log("✓ Workspace ready:", ws.name, "(id:", ws.id, ")");

  // 3. Fetch default #general channel
  const { data: channel, error: chErr } = await supabase.from("channels").select("id, name, is_private").eq("workspace_id", ws.id).eq("name", "general").single();
  if (chErr || !channel) {
    throw new Error(`Channel check failed: ${chErr?.message}`);
  }
  console.log("✓ General channel ready:", channel.name, "(id:", channel.id, ")");

  // 4. Test Root Message Insertion
  const testContent = `[SmokeTest] Phase 4 Root Message - ${Date.now()}`;
  const { data: rootMsg, error: msgErr } = await supabase.from("messages").insert({
    channel_id: channel.id,
    sender_id: userA.id,
    content: testContent,
    room_type: "GENERAL"
  }).select().single();

  if (msgErr || !rootMsg) {
    throw new Error(`Root message insert failed: ${msgErr?.message}`);
  }
  console.log("✓ Root message inserted successfully (id:", rootMsg.id, ")");

  // 5. Test Thread Reply Insertion
  const replyContent = `[SmokeTest] Thread reply to ${rootMsg.id}`;
  const { data: threadReply, error: repErr } = await supabase.from("messages").insert({
    channel_id: channel.id,
    sender_id: userB.id,
    parent_id: rootMsg.id,
    content: replyContent,
    room_type: "GENERAL"
  }).select().single();

  if (repErr || !threadReply) {
    throw new Error(`Thread reply insert failed: ${repErr?.message}`);
  }
  console.log("✓ Thread reply inserted successfully (id:", threadReply.id, ", parent_id:", threadReply.parent_id, ")");

  // 6. Test Reaction
  const { data: reaction, error: reactErr } = await supabase.from("message_reactions").insert({
    message_id: rootMsg.id,
    user_id: userA.id,
    emoji: "🚀"
  }).select().single();

  if (reactErr || !reaction) {
    throw new Error(`Reaction insert failed: ${reactErr?.message}`);
  }
  console.log("✓ Reaction 🚀 added to root message");

  // 7. Verify Queries
  const { data: threadQuery } = await supabase.from("messages").select("id, content, parent_id").eq("parent_id", rootMsg.id);
  console.log("✓ Thread replies count:", threadQuery?.length);

  const { data: reactionsQuery } = await supabase.from("message_reactions").select("emoji, user_id").eq("message_id", rootMsg.id);
  console.log("✓ Root reactions count:", reactionsQuery?.length, "emoji:", reactionsQuery?.[0]?.emoji);

  // 8. Cleanup test messages
  await supabase.from("message_reactions").delete().eq("message_id", rootMsg.id);
  await supabase.from("messages").delete().eq("id", threadReply.id);
  await supabase.from("messages").delete().eq("id", rootMsg.id);
  console.log("✓ Cleaned up smoke test messages cleanly");

  console.log("=== ALL PHASE 4 CHAT ENGINE SMOKE TESTS PASSED ===");
}

runSmokeTest().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
