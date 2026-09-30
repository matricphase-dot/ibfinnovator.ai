import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "supabase.cmd" : "supabase";
const version = spawnSync(command, ["--version"], { encoding: "utf8" });
if (version.error || version.status !== 0) {
  console.error("Supabase CLI is required for database smoke tests. Install it and run with a local Supabase stack.");
  process.exit(1);
}

const reset = spawnSync(command, ["db", "reset", "--local"], {
  stdio: "inherit",
});
if (reset.status !== 0) process.exit(reset.status || 1);

const tests = spawnSync(command, ["test", "db", "--local"], {
  stdio: "inherit",
});
process.exit(tests.status || 0);
