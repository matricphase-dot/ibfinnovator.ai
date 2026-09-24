import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const envContent = readFileSync(envPath, "utf-8");
let redisUrl = "";
let redisToken = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("UPSTASH_REDIS_REST_URL=")) {
    redisUrl = trimmed.substring("UPSTASH_REDIS_REST_URL=".length).replace(/^["']|["']$/g, "");
  } else if (trimmed.startsWith("UPSTASH_REDIS_REST_TOKEN=")) {
    redisToken = trimmed.substring("UPSTASH_REDIS_REST_TOKEN=".length).replace(/^["']|["']$/g, "");
  }
}

if (!redisUrl || !redisToken) {
  console.log("ℹ️  UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured yet in .env.local");
  console.log("   Follow the setup guide to create a database on https://console.upstash.com/ and paste the credentials.");
  process.exit(0);
}

console.log("=================================================");
console.log("⚡ TESTING UPSTASH REDIS CONNECTION");
console.log("=================================================");
console.log(`Endpoint: ${redisUrl}`);

async function testUpstash() {
  try {
    const res = await fetch(`${redisUrl}/ping`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (!res.ok) {
      console.error(`❌ Connection failed with HTTP ${res.status}: ${await res.text()}`);
      return;
    }

    const data = await res.json();
    if (data.result === "PONG") {
      console.log("✅ Upstash Ping test: PONG (Success!)");
      
      // Test pipeline operation
      const now = Date.now();
      const testKey = `test:healthcheck:${now}`;
      const pipeRes = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["SET", testKey, "ok"],
          ["GET", testKey],
          ["DEL", testKey],
        ]),
      });

      if (pipeRes.ok) {
        console.log("✅ Upstash Pipeline test: Operates normally");
        console.log("🎉 Upstash Redis is active and ready for distributed rate-limiting!");
      }
    } else {
      console.log("⚠️ Unexpected response:", data);
    }
  } catch (err) {
    console.error("❌ Network error connecting to Upstash:", err.message);
  }
  console.log("=================================================");
}

testUpstash();
