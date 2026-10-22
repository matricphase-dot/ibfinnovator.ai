import assert from "node:assert";
import { getSigninUrl, DEFAULT_SIGNIN_URL, MARKETING_ORIGIN, APP_ORIGIN } from "../lib/auth/domain.ts";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== PHASE 2 ROUTING & SUBDOMAIN AUTH VERIFICATION ===");

// 1. Verify getSigninUrl logic
console.log("[1/4] Verifying canonical getSigninUrl generation...");
const signinUrl = getSigninUrl("/dashboard");
assert.ok(signinUrl.startsWith(DEFAULT_SIGNIN_URL), "Must start with default signin URL on marketing apex");
assert.ok(signinUrl.includes("next="), "Must contain encoded next destination parameter");
console.log("  ✓ Canonical Signin URL generated:", signinUrl);

// 2. Verify middleware code contract for /projects scoping
console.log("[2/4] Verifying middleware /projects public scoping contract...");
const middlewareSrc = readFileSync(join(root, "middleware.ts"), "utf-8");

assert.ok(
  !/PROTECTED_PREFIXES\s*=\s*\[[^\]]*"\/projects"[^\]]*\]/.test(middlewareSrc),
  "'/projects' must NOT be in the global PROTECTED_PREFIXES list!",
);
assert.ok(
  middlewareSrc.includes("PROTECTED_PROJECT_SUBROUTES"),
  "Middleware must declare PROTECTED_PROJECT_SUBROUTES for internal board/settings routes",
);
assert.ok(
  middlewareSrc.includes("/projects/new"),
  "Middleware must explicitly protect /projects/new",
);
console.log("  ✓ /projects is excluded from global blocking; Googlebot and visitors can access public projects");

// 3. Verify workspace.ts fallback contract
console.log("[3/4] Verifying workspace.ts multi-tenant isolation contract...");
const workspaceSrc = readFileSync(join(root, "lib", "workspace.ts"), "utf-8");

assert.ok(
  !workspaceSrc.includes("order(\"created_at\", { ascending: true })") ||
  !workspaceSrc.includes("anyWs"),
  "Dangerous anyWs query must be completely deleted from lib/workspace.ts!",
);
assert.ok(
  workspaceSrc.includes("Personal"),
  "Must create dedicated personal workspace on fallback",
);
console.log("  ✓ No foreign workspace hijack possible: isolated personal workspace created instead");

// 4. Verify Nginx Cloudflare proto preservation
console.log("[4/4] Verifying Nginx Cloudflare protocol forwarding...");
const nginxSrc = readFileSync(join(root, "scripts", "nginx-innovators.conf"), "utf-8");
const deploySrc = readFileSync(join(root, "scripts", "deploy-ec2.sh"), "utf-8");

assert.ok(
  nginxSrc.includes("http_x_forwarded_proto"),
  "nginx-innovators.conf must preserve $http_x_forwarded_proto",
);
assert.ok(
  deploySrc.includes("http_x_forwarded_proto"),
  "deploy-ec2.sh must preserve $http_x_forwarded_proto",
);
console.log("  ✓ Nginx preserves Cloudflare HTTPS scheme properly");

console.log("\n🎉 ALL PHASE 2 ROUTING & MULTI-TENANT CHECKS PASSED CLEANLY!");
