import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== PHASE 2.4 NGINX PROTOCOL & CLOUDFLARE FORWARDING CONTRACT VERIFICATION ===");

const files = [
  {
    path: join(root, "nginx", "innovators.conf"),
    name: "nginx/innovators.conf",
  },
  {
    path: join(root, "scripts", "nginx-innovators.conf"),
    name: "scripts/nginx-innovators.conf",
  },
  {
    path: join(root, "scripts", "deploy-ec2.sh"),
    name: "scripts/deploy-ec2.sh",
  },
];

for (const { path, name } of files) {
  console.log(`Checking ${name}...`);
  const content = readFileSync(path, "utf-8");

  // 1. Must NOT set X-Forwarded-Proto to bare $scheme
  assert.ok(
    !content.includes("proxy_set_header X-Forwarded-Proto $scheme;"),
    `${name} must NOT set X-Forwarded-Proto to $scheme (breaks behind Cloudflare Flexible/Full SSL)!`
  );

  // 2. Must forward $http_x_forwarded_proto with fallback to $scheme
  assert.ok(
    content.includes("set $forwarded_proto $http_x_forwarded_proto;"),
    `${name} must capture $http_x_forwarded_proto!`
  );
  assert.ok(
    content.includes("proxy_set_header X-Forwarded-Proto $forwarded_proto;"),
    `${name} must forward $forwarded_proto to Next.js!`
  );

  // 3. Must preserve X-Forwarded-Host for Next.js subdomain routing
  assert.ok(
    content.includes("proxy_set_header X-Forwarded-Host $host;"),
    `${name} must forward X-Forwarded-Host for subdomain routing!`
  );

  // 4. Must support Cloudflare CF-Connecting-IP for accurate client IP identification
  assert.ok(
    content.includes("$http_cf_connecting_ip"),
    `${name} must capture CF-Connecting-IP for accurate client identification!`
  );
  assert.ok(
    content.includes("proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"),
    `${name} must set X-Forwarded-For!`
  );

  console.log(`  ✓ ${name} conforms 100% to production Cloudflare + HTTPS forwarding contract`);
}

console.log("\n🎉 ALL PHASE 2.4 NGINX PROTOCOL FORWARDING CHECKS PASSED CLEANLY!");
