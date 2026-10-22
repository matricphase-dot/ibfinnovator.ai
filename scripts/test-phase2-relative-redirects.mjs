import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSigninUrl, DEFAULT_SIGNIN_URL, MARKETING_ORIGIN } from "../lib/auth/domain.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== PHASE 2.3 CANONICAL APEX SIGNIN REDIRECTS SUITE ===");

// 1. Verify getSigninUrl generation contract
console.log("[1/6] Verifying getSigninUrl canonical URL generation...");
const testDest = "/dashboard";
const canonicalUrl = getSigninUrl(testDest);
assert.ok(
  canonicalUrl.includes("/auth/signin"),
  "Generated signin URL must contain /auth/signin",
);
assert.ok(
  canonicalUrl.includes("next="),
  "Generated signin URL must contain encoded next parameter",
);
console.log("  ✓ getSigninUrl produces canonical signin URL with destination:", canonicalUrl);

// 2. Verify settings page uses getSigninUrl
console.log("[2/6] Verifying app/settings/page.tsx redirect contract...");
const settingsSrc = readFileSync(join(root, "app", "settings", "page.tsx"), "utf-8");
assert.ok(
  settingsSrc.includes('getSigninUrl("/settings")'),
  "app/settings/page.tsx must use getSigninUrl('/settings')",
);
assert.ok(
  !settingsSrc.includes('window.location.assign("/auth/signin'),
  "app/settings/page.tsx must NOT use relative /auth/signin assign!",
);
console.log("  ✓ Settings page uses canonical apex redirect on 401 unauthenticated");

// 3. Verify team page uses getSigninUrl
console.log("[3/6] Verifying app/team/[projectId]/page.tsx redirect contract...");
const teamSrc = readFileSync(join(root, "app", "team", "[projectId]", "page.tsx"), "utf-8");
assert.ok(
  teamSrc.includes("getSigninUrl(`"),
  "app/team/[projectId]/page.tsx must use getSigninUrl for redirect",
);
assert.ok(
  !teamSrc.includes('window.location.assign("/auth/signin'),
  "app/team/[projectId]/page.tsx must NOT use relative /auth/signin assign!",
);
console.log("  ✓ Team page uses canonical apex redirect on 401 unauthenticated");

// 4. Verify direct chat page uses getSigninUrl
console.log("[4/6] Verifying app/chat/direct/[projectId]/page.tsx redirect contract...");
const chatDirectSrc = readFileSync(join(root, "app", "chat", "direct", "[projectId]", "page.tsx"), "utf-8");
assert.ok(
  chatDirectSrc.includes("getSigninUrl(`"),
  "app/chat/direct/[projectId]/page.tsx must use getSigninUrl for redirect",
);
assert.ok(
  !chatDirectSrc.includes('window.location.assign("/auth/signin'),
  "app/chat/direct/[projectId]/page.tsx must NOT use relative /auth/signin assign!",
);
console.log("  ✓ Direct chat page uses canonical apex redirect on 401 unauthenticated");

// 5. Verify workspace-context.tsx uses getSigninUrl
console.log("[5/6] Verifying workspace-context.tsx redirect contract...");
const wsContextSrc = readFileSync(join(root, "components", "ibf", "layout", "workspace-context.tsx"), "utf-8");
assert.ok(
  wsContextSrc.includes("getSigninUrl(currentDest)"),
  "workspace-context.tsx must use getSigninUrl on 401 unauthenticated",
);
console.log("  ✓ Workspace provider uses canonical apex redirect on 401 unauthenticated");

// 6. Verify user menu uses DEFAULT_SIGNIN_URL & MARKETING_ORIGIN
console.log("[6/6] Verifying ibf-user-menu.tsx logout & invite contracts...");
const userMenuSrc = readFileSync(join(root, "components", "ibf", "layout", "ibf-user-menu.tsx"), "utf-8");
assert.ok(
  userMenuSrc.includes("window.location.assign(DEFAULT_SIGNIN_URL)"),
  "ibf-user-menu.tsx must assign to DEFAULT_SIGNIN_URL on logout",
);
assert.ok(
  userMenuSrc.includes("MARKETING_ORIGIN + \"/auth/signup\"") ||
  userMenuSrc.includes("`${MARKETING_ORIGIN}/auth/signup`"),
  "ibf-user-menu.tsx must use MARKETING_ORIGIN for invite copy",
);
console.log("  ✓ User menu strictly binds logout and invite links to canonical marketing apex");

console.log("\n🎉 ALL PHASE 2.3 CANONICAL APEX SIGNIN REDIRECT CHECKS PASSED CLEANLY!");
