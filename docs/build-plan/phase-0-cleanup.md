# Phase 0: Dead Code Elimination & Cleanup
> **Status:** ✅ **COMPLETED & VERIFIED** · Ponytail Strict: Deletion beats addition  
> **Results:** Clean compiler baseline, 54 dead npm packages removed, 0 type errors, production build passed (48/48 routes static/dynamic).

---

## 1. Objectives
- Delete all unused legacy routes, components, and API endpoints identified in the audit.
- Prune `package.json` of unneeded dependencies (e.g., Stripe if billing is deferred, or obsolete chart/mock libraries).
- Fix broken imports and ensure `npm run typecheck` passes with zero errors on the clean base.

---

## 2. Exact Files & Directories to Delete

### 2.1 Route Groups to Remove (`src/app/` or `app/`)
```bash
# Delete Marketplace & Mentorship pages
rm -rf src/app/(marketplace)
rm -rf src/app/marketplace
rm -rf src/app/mentorship
rm -rf src/app/mentors
rm -rf src/app/investors
rm -rf src/app/deals
rm -rf src/app/talent

# Delete Legacy API Routes
rm -rf src/app/api/marketplace
rm -rf src/app/api/mentors
rm -rf src/app/api/investors
rm -rf src/app/api/deals
```

### 2.2 Components to Remove (`src/components/`)
```bash
# Delete legacy domain components
rm -rf src/components/marketplace
rm -rf src/components/mentorship
rm -rf src/components/investors
rm -rf src/components/deals
```

### 2.3 Legacy Database Migrations / Types to Archive or Delete
- Remove unused types in `src/types/` relating to Mentor sessions, Marketplace listings, Escrow payments.

---

## 3. Dependency Pruning in `package.json`

Examine and remove packages that are no longer in scope:
- Check for Stripe/LemonSqueezy packages if payment escrow is eliminated for MVP.
- Remove redundant carousel/3D/canvas libraries not used in the core PM, Chat, or Portfolio features.

---

## 4. Verification & Gate Checks
Run in terminal:
```bash
npm run typecheck
npm run lint
npm run build
```
**Gate Rule:** Phase 0 is complete ONLY when `npm run build` succeeds without unresolved imports or broken references.
