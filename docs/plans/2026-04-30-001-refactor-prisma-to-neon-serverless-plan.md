---
title: "refactor: migrate Prisma to @neondatabase/serverless via per-call swap"
type: refactor
status: active
date: 2026-04-30
origin: docs/brainstorms/2026-04-30-prisma-to-neon-serverless-migration-requirements.md
---

# refactor: migrate Prisma to @neondatabase/serverless via per-call swap

## Summary

Replace `@prisma/client` + `@prisma/adapter-pg` with `@neondatabase/serverless` across 63 callsites in 10 files via per-call closure-body swap inside identical `step.run` identifiers — Inngest replay safe, zero acquisition downtime, fully revertable per PR. Pre-cutover step zero snapshots `db/schema.sql` and freezes `prisma migrate` so H1 (Account / ConsultingEngagement / BundleSeat) ships as a raw SQL migration between Batch 1 and Batch 2 of the cutover, unblocking Austin's consulting-attach-rate scorecard ~3 weeks earlier than waiting for the full Prisma rip.

---

## Problem Frame

Prisma 7.8.0 dropped `url` and `directUrl` from `schema.prisma` (verified: the `keegan/backup-2026-04-28-r8e8` preview build failed on this 2026-04-30). Future framework moves will keep breaking on Prisma's release cadence. Adding H1 attach-rate models via Prisma now means those models get a codegen entry that has to be unwound during the migration anyway — better to pre-establish SQL-as-source-of-truth so H1 ships once in its final form. The North Star is closing the consulting → bundle-subscription attribution loop; this migration is the prerequisite that keeps that work from being re-done.

---

## Requirements

- R1. End state: `package.json` no longer carries `@prisma/client`, `@prisma/adapter-pg`, or `prisma`; `@neondatabase/serverless` is the canonical query client.
- R2. End state: `db/schema.sql` is the canonical schema artifact; `prisma/` directory is deleted; new schema changes ship as numbered raw SQL files in `db/migrations/`.
- R3. End state: every former Prisma callsite uses `sql\`…\`` template-literal queries with hand-written row types from `lib/db-types.ts`.
- R4. Constraint: zero acquisition-pipeline downtime. The Vercel cron at `app/api/cron/acquire-due/route.ts` must produce equivalent `AcquisitionJob` rows the morning after each batch ships.
- R5. Constraint: zero in-flight Inngest job loss. Identical `step.run("…")` identifiers across the closure-body swap so deterministic replay tolerates any deploy mid-run.
- R6. Constraint: H1 schema migration (Account / ConsultingEngagement / BundleSeat) ships during cutover, between Batch 1 and Batch 2 — does not wait for full Prisma deletion.
- R7. Constraint: every per-batch PR is revertable via `git revert <PR-sha>` with no schema implications.
- R8. Constraint: each per-batch PR soaks ≥24 hours in production before the next batch's PR opens (closing PR soaks ≥1 week).

---

## Scope Boundaries

- Drizzle ORM as a codemod target — explicitly out (per origin, not relitigated here).
- Strategy A (drain-and-flip) and Strategy C (Prisma-shape adapter shim) — rejected in brainstorm.
- H1 model design (column shapes, constraints, indices, foreign keys) — only **timing** decided; full design is its own brainstorm.
- Bobbito agent integration beyond the existing 202-stub at `app/api/agent/route.ts` — separate brainstorm.
- WEDGE_MAP "what's your stack costing you?" tool — separate brainstorm.
- Vercel deployment-protection toggle for the production URL (currently 401-gated) — operations decision, not migration scope.
- Inngest dev-environment migration — assumed dev uses neon-serverless from day 1, no separate cutover.

### Deferred to Follow-Up Work

- H1 model-design brainstorm: opens after this plan's Batch 1 lands; produces the SQL DDL that becomes U7 of this plan.
- `pg` (node-postgres) deletion: `pg` is retained through the cutover for `seed.ts` true-transaction support (U11). Whether to delete it after the migration completes is a follow-up decision once `seed.ts` ergonomics are validated in production.

---

## Context & Research

### Relevant Code and Patterns

- `inngest/functions/acquire-surface.ts` — every state mutation already wrapped in `step.run("step-name", fn)` for deterministic replay. The closure bodies inside are what get swapped; the step names stay byte-identical. This is the load-bearing convention that makes Strategy B safe.
- `lib/acquisition/policies.ts` — YAML-shaped routing table in TypeScript (9 platforms × 3-4 providers each). Pattern for the 9 providers under `lib/acquisition/providers/` exposing a common `collect({surface, policy, windowStart, windowEnd})` interface.
- `lib/intent/__tests__/*.smoke.ts` — existing test pattern: vanilla `node:assert/strict` + `tsx file.smoke.ts`. No framework. Each smoke test is a top-level script that asserts via `assert.equal` / `assert.ok`. Migration tests follow this pattern.
- `lib/env.ts` — zod-validated env schema; only `DATABASE_URL` is required (`.min(1)`). All other vars are optional. Surfacing this matters because the build collect-page failure on the salvage-branch preview was a `DATABASE_URL` absence, not a schema problem.
- `lib/prisma.ts` and `lib/db.ts` — current dual exports, both re-export the Prisma client. Closing PR (U12) collapses these to a single `lib/db.ts` that re-exports `sql` from `lib/db-neon.ts`.
- `prisma/seed.ts` — 39 ops with intermediate JS logic (e.g., insert Employee, capture id, insert Surface referencing employeeId). This shape requires real `BEGIN ... COMMIT` transactions, not `neon.transaction([…])`'s sequential array.

### Institutional Learnings

- `docs/solutions/` does not exist yet. No prior migration learnings recorded.

### External References

- `@neondatabase/serverless` HTTP transport supports `neon.transaction([...])` only as sequential queries with no intermediate JS — confirmed via package docs. For mid-transaction logic, fall back to `pg` over the Pooler URL.
- Inngest deterministic replay: when a function is replayed, cached step results are returned for previously-run steps; only the JS code structure (step names, ordering) needs to be stable across deploys. Closure-body changes inside an unchanged step name are safe.

---

## Key Technical Decisions

- **Test framework: match existing pattern, no new dep.** Use vanilla `node:assert/strict` + `tsx` execution. New tests live as `lib/db-neon/__tests__/*.smoke.ts` and assert query result shape against inline expected values. Rationale: avoids a 50+ MB vitest install during a refactor that adds zero product value, keeps the same mental model the team already has from `lib/intent/__tests__/`.
- **`seed.ts` uses `pg`, not `neon-serverless`.** Port `prisma/seed.ts` → `db/seed.ts` using the existing `pg` (`@types/pg` v8.20.0) dependency over the Pooler `DATABASE_URL`. Wrap the 39 ops in a single `BEGIN ... COMMIT` block. Rationale: seed.ts has intermediate JS logic between INSERTs (capture employee id → insert surface referencing it) that `neon.transaction([…])` cannot express. Keeping `pg` in deps post-migration is the price of seed correctness.
- **Row types: hand-written, not introspected.** Create `lib/db-types.ts` with TypeScript types for the 25 models, derived manually from `db/schema.sql`. Rationale: avoids adding `kysely-codegen` or similar (one of the migration's stated goals is dependency reduction); ~3 hours of manual work amortized across the project lifetime; exact control over types (camelCase mapping, nullable vs optional, derived columns).
- **PR sequencing: one PR per batch (not one per file).** 5 cutover batches = 5 PRs, plus 5 pre-cutover scaffolding PRs and 1 closing PR = 11 total. Each batch PR migrates all callsites in 2-4 related files atomically, since callsites within a file share imports and types. Rationale: PR-per-file would produce ~10 micro-PRs that thrash review attention; PR-per-batch matches the natural verification gate (one batch, one soak window, one revert candidate).
- **Coexistence period: `pg`, `@prisma/client`, `@prisma/adapter-pg`, `@neondatabase/serverless` all in `package.json` for ~3-4 weeks.** Bundle size cost is acceptable; both clients connect to the same Neon DB. Final state has `pg` + `@neondatabase/serverless` only.
- **Schema source-of-truth flips at U2.** From U2 onward, `prisma/schema.prisma` is a stale codegen reference (only consulted for type-derivation during U3); all schema changes — including H1 — ship as raw SQL in `db/migrations/`. `prisma migrate` is disabled in CI/pre-commit hooks (no current Husky config detected, so this is a `package.json` scripts-only change).

---

## Open Questions

### Resolved During Planning

- Test framework? → match existing `node:assert + tsx + .smoke.ts` pattern (no new dep).
- `seed.ts` transaction shape? → `pg` over Pooler URL, single `BEGIN ... COMMIT` block.
- PR sequencing within each batch? → one PR per batch; all callsites in 2-4 related files migrate atomically.
- Hand-written vs introspected row types? → hand-written, `lib/db-types.ts`.
- Where does H1 ship? → as U7, between Batch 1 (U6) and Batch 2 (U8). Raw SQL migration only.

### Deferred to Implementation

- Exact SQL for each callsite's translated query — discovered during the closure-body swap; some Prisma `findMany({where, include})` calls become 2-3 sequential SQL queries with JS-side joining, others fold to a single SELECT with a join.
- Whether `pg` connection pooling needs explicit `.end()` calls in `db/seed.ts` (depends on Vercel runtime behavior).
- The exact column-name convention for H1 tables (snake_case vs camelCase) — decided in the H1 model-design brainstorm, not here.
- Whether `lib/db-neon.ts` exposes a single `sql` template-literal export or also a `sqlUnsafe` for dynamic identifiers (column names, table names) — discovered when the first callsite needs dynamic identifiers, if any.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

The cutover is a sequence of in-place callsite swaps inside unchanged Inngest step boundaries. Each swap looks like:

```
Before                                         After
------                                         -----
step.run("upsert-job", () =>                   step.run("upsert-job", async () => {
  db.acquisitionJob.upsert({                     const [job] = await sql`
    where: { idempotencyKey },                     INSERT INTO "AcquisitionJob"
    create: { /* ... */ },                           (id, "surfaceId", "idempotencyKey", /* ... */)
    update: { /* ... */ },                         VALUES (gen_random_uuid(), ${surfaceId}, ${idempotencyKey}, /* ... */)
  })                                               ON CONFLICT ("idempotencyKey") DO UPDATE SET
)                                                    /* ... update fields ... */
                                                   RETURNING *`;
                                                 return job as AcquisitionJob;
                                               })
```

The step name `"upsert-job"` is preserved across the swap. Inngest's deterministic replay sees the same step identifier and the same surrounding shape, so any in-flight run that resumes after a deploy uses the cached result if the step already completed, or executes the new closure body if it hadn't run yet. Either path is safe.

Cutover sequence diagram:

```mermaid
sequenceDiagram
    participant Ops as Ops/CI
    participant Repo as Repo (main)
    participant Vercel as Vercel Deploy
    participant Inngest as Inngest Queue
    participant Neon as Neon DB

    Note over Ops,Neon: Pre-cutover (U1-U5)
    Ops->>Vercel: U1: DATABASE_URL → all preview environments
    Repo->>Repo: U2: pg_dump → db/schema.sql; move migrations
    Repo->>Repo: U3: lib/db-types.ts (hand-written)
    Repo->>Repo: U4: lib/db-enums.ts + sweep 42 import sites
    Repo->>Repo: U5: lib/db-neon.ts scaffold

    Note over Ops,Neon: Batch 1 (U6) — cron path
    Repo->>Vercel: U6 PR merged
    Vercel->>Inngest: deploy
    Note over Inngest: any in-flight acquire-surface<br/>resumes via cached step results;<br/>new step.run closures use neon-serverless
    Inngest->>Neon: writes via neon-serverless
    Note over Ops,Neon: 24h soak — verify next-morning cron green

    Note over Ops,Neon: H1 schema (U7)
    Repo->>Neon: U7: db/migrations/2026-XX-XX_h1.sql applied
    Note over Neon: Account / ConsultingEngagement / BundleSeat tables exist

    Note over Ops,Neon: Batches 2-5 (U8-U11) — same pattern
    Repo->>Vercel: U8 → soak → U9 → soak → U10 → soak → U11 → soak

    Note over Ops,Neon: Closing PR (U12)
    Repo->>Vercel: U12: pnpm remove @prisma/* prisma; rewrite lib/db.ts
    Note over Ops,Neon: 1-week soak
```

---

## Implementation Units

- U1. **Vercel env-config consolidation**

**Goal:** Add `DATABASE_URL` to all Vercel preview environments (currently only on the `phase-4b-x-real-data` branch) so any future preview build can satisfy `lib/env.ts:11`'s `DATABASE_URL.min(1)` validation. Production already has it.

**Requirements:** Precondition for R4 (cron pipeline must keep running on every preview), unblocks `salvage/every-folder-specs` (PR #20).

**Dependencies:** None.

**Files:**
- No code changes — this is an ops-only step using `vercel env add DATABASE_URL preview`. Document the action in the PR description for U2 so the chain is auditable.

**Approach:**
- Run `vercel env add DATABASE_URL preview` (interactive — needs the value pasted, hence operator-driven, not automatable).
- Verify with `vercel env ls` that `DATABASE_URL` shows `Preview` (no branch-scope) alongside `Production` and `Development`.
- Trigger a redeploy on `salvage/every-folder-specs` (PR #20) to confirm the env-validation passes.

**Patterns to follow:** Vercel CLI conventions documented in `docs/specs/PRINCIPAL_ENGINEER_BUILD_SPEC.md`.

**Test scenarios:**
- Happy path: `vercel env ls` shows `DATABASE_URL` for `Production, Preview, Development` (not `Preview (phase-4b-x-real-data)`).
- Integration: PR #20's preview build progresses past `lib/env.ts` validation and either succeeds or fails on a different error (not the env error).

**Verification:**
- PR #20 preview build no longer fails at `Error: Invalid environment configuration. See .env.example.`
- The salvage-branch preview deployment URL returns a non-error response when curled.

---

- U2. **Schema-as-SQL initialization**

**Goal:** Establish `db/schema.sql` as the canonical schema artifact and move existing migration history into `db/migrations/`. From this PR onward, `prisma migrate` is disabled and all schema changes ship as raw SQL.

**Requirements:** R2 (canonical SQL artifact). Precondition for U7 (H1 ships as raw SQL).

**Dependencies:** U1.

**Files:**
- Create: `db/schema.sql`
- Create: `db/migrations/` directory; move contents of `prisma/migrations/*` into it (`git mv` preserves history)
- Modify: `package.json` — remove `db:push` script (or rewrite to `psql $DATABASE_URL -f db/schema.sql`); leave `prisma:validate` and `prisma:generate` for the duration of the cutover so existing types still generate
- Modify: `package.json` — add `db:migrate` script that lists / applies new SQL files in `db/migrations/`

**Approach:**
- Run `pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > db/schema.sql`. Hand-edit any noise (search_path comments, COMMENT-only lines that bloat the diff).
- Confirm `db/schema.sql` matches Prisma's view of the schema by running `prisma db pull` against a scratch DB seeded from `db/schema.sql`; compare against current `prisma/schema.prisma`. Resolve any drift by editing `db/schema.sql` (the SQL is canonical).
- Document in this PR's description that all subsequent schema changes go through SQL migrations.

**Patterns to follow:** No existing pattern in this repo. Adopt the convention of `db/migrations/YYYY-MM-DD-<short-name>.sql` for new files.

**Test scenarios:**
- Happy path: Spinning a fresh Neon branch and running `psql $BRANCH_URL -f db/schema.sql` produces a schema where `prisma db pull` against that branch yields a `schema.prisma` byte-identical (modulo formatting) to the current `prisma/schema.prisma`.
- Integration: `prisma migrate status` against the production DB no longer expects new migrations.

**Verification:**
- `db/schema.sql` exists, ~2-4 KB per Prisma model (~50-100 KB total).
- `db/migrations/` contains the historical migrations (verify with `git log --follow`).
- Running the `db:push` script equivalent applies cleanly to a scratch DB.

---

- U3. **Hand-written row types in `lib/db-types.ts`**

**Goal:** Provide TypeScript types for the 25 schema models, derived manually from `db/schema.sql`. Each type matches the Prisma model name so callsite migrations are a one-line import swap (`import { AcquisitionJob } from "@prisma/client"` → `import { AcquisitionJob } from "@/lib/db-types"`).

**Requirements:** R3 (hand-written types feed every migrated callsite).

**Dependencies:** U2.

**Files:**
- Create: `lib/db-types.ts`
- Test: `lib/__tests__/db-types.smoke.ts`

**Approach:**
- Each Prisma model becomes a named `export type X = { ... }` with fields matching the camelCase column names from `prisma/schema.prisma` (Prisma already maps these). Use `string`, `number`, `boolean`, `Date`, and `null` for nullables; `?` for optional fields (those without DB defaults).
- Carry over enum types from `lib/db-enums.ts` (U4) once that PR lands; for this PR, reference enums by string-literal union as a placeholder.
- Add a top-level comment with the source-of-truth pointer: `// Generated by hand from db/schema.sql. Update both when schema changes.`
- Order types alphabetically for diff stability.

**Patterns to follow:** None directly; this is a new file. Mirror the alphabetization convention used in `lib/acquisition/policies.ts`.

**Test scenarios:**
- Happy path: Importing each type and constructing a minimal valid instance compiles. (One smoke test per type; ~25 cases.)
- Edge case: Nullable fields (`null`) are distinguishable from optional fields (`undefined`) in the type signature — explicitly construct one of each per affected type.

**Verification:**
- `pnpm typecheck` passes.
- Running the `lib/__tests__/db-types.smoke.ts` script via `tsx` exits 0.
- A grep for `from "@prisma/client"` returns no occurrences in `lib/db-types.ts` itself.

---

- U4. **Enum const-unions in `lib/db-enums.ts` + 42-import-site sweep**

**Goal:** Replace Prisma's enum imports with local TypeScript const unions for the 8 enums (`Platform`, `MetricConfidence`, `DataReadiness`, `SourceReadiness`, `AcquisitionProvider`, `AcquisitionJobStatus`, `IntentClass`, `ShotOutcome`). Sweep all 42 import sites in one mechanical PR.

**Requirements:** R3 (decouple from Prisma's runtime).

**Dependencies:** U3.

**Files:**
- Create: `lib/db-enums.ts`
- Modify: 42 files — every site that currently has `import { … } from "@prisma/client"`. Verified counts; exact files identified via `grep -rln "from \"@prisma/client\""` immediately before this PR opens.
- Modify: `lib/db-types.ts` — replace any string-literal-union placeholders for enums with imports from `lib/db-enums.ts`
- Test: `lib/__tests__/db-enums.smoke.ts`

**Approach:**
- For each enum, export a const object plus a derived type:
  ```
  export const Platform = {
    X: "X", LINKEDIN: "LINKEDIN", GITHUB: "GITHUB", /* ... */
  } as const;
  export type Platform = typeof Platform[keyof typeof Platform];
  ```
- The mechanical sweep is best done with a single multi-file find-and-replace; verify with `pnpm typecheck` after.

**Patterns to follow:** `lib/acquisition/types.ts` already has small const-object patterns; mirror those.

**Test scenarios:**
- Happy path: Importing each enum and using all members compiles and matches `Object.values(Enum)` returning the expected string literals.
- Edge case: A value not in the enum is rejected at compile time when assigned to the type. (TypeScript-only check; verify with a type-only assertion in the smoke test.)

**Verification:**
- `grep -rln 'from "@prisma/client"' app/ lib/ inngest/ scripts/ prisma/` returns zero occurrences.
- `pnpm typecheck` passes.
- Running each enum's runtime values matches the SQL `CREATE TYPE` definitions in `db/schema.sql`.

---

- U5. **`lib/db-neon.ts` scaffold**

**Goal:** Stand up the canonical neon-serverless client export. Does NOT replace `lib/db.ts` — that import alias still points to Prisma until U6 starts swapping callsites. This PR adds the new client; no callsite uses it yet.

**Requirements:** R1 (new client exists), R5 (idempotent and Inngest-replay-safe by construction).

**Dependencies:** U4.

**Files:**
- Create: `lib/db-neon.ts`
- Test: `lib/__tests__/db-neon.smoke.ts`

**Approach:**
- Configure `neonConfig.fetchConnectionCache = true` for connection reuse on Vercel/Edge.
- Export `sql` from `@neondatabase/serverless` parameterized with `env.DATABASE_URL` from `lib/env.ts`.
- Add `import "server-only"` to enforce server-only usage.
- Add a brief module-level comment naming the migration plan and the eventual replacement of `lib/db.ts`.
- Smoke test: a trivial `SELECT 1 AS ok` round-trip using the new `sql` template-literal client, asserting the result is `[{ ok: 1 }]`. This is the canonical "is the client wired up?" check.

**Patterns to follow:** `lib/prisma.ts` for the `import "server-only"` and singleton-client pattern.

**Test scenarios:**
- Happy path: `sql\`SELECT 1 AS ok\`` returns `[{ ok: 1 }]`.
- Error path: With an invalid `DATABASE_URL`, the client throws a recognizable error (not a silent hang).

**Verification:**
- `pnpm typecheck` passes.
- `tsx lib/__tests__/db-neon.smoke.ts` exits 0 against a valid `DATABASE_URL`.
- `lib/db.ts` still exports the Prisma client (unchanged at this point).

---

- U6. **Batch 1 — cron path callsite migration**

**Goal:** Migrate the cron path's 4 files to use `lib/db-neon.ts` while preserving every `step.run("…")` identifier byte-identical. After this PR ships, the next-morning Vercel cron run validates the migration end-to-end.

**Requirements:** R3, R4, R5, R7. Establishes the verification template for U8-U11.

**Dependencies:** U5.

**Files:**
- Modify: `app/api/cron/acquire-due/route.ts`
- Modify: `app/api/ingest/route.ts`
- Modify: `app/api/discover/route.ts`
- Modify: `inngest/functions/acquire-surface.ts`
- Test: `lib/__tests__/acquire-surface-shape.smoke.ts` (asserts SQL query result shape against fixture)

**Approach:**
- For each callsite, swap the closure body:
  - `db.X.findUnique({where, include})` → 1-2 `await sql\`SELECT … WHERE … LIMIT 1\`` queries (when relations are loaded), with JS-side composition.
  - `db.X.upsert({where, create, update})` → `await sql\`INSERT … ON CONFLICT (key) DO UPDATE SET … RETURNING *\``.
  - `db.X.update({where, data})` → `await sql\`UPDATE X SET … WHERE id = ${id} RETURNING *\``.
  - `db.X.findMany({where, include})` → 1-N `await sql\`SELECT … WHERE …\`` queries with JS-side joins.
- The `step.run` identifier (e.g., `"upsert-job"`, `"check-idempotency"`, `"mark-succeeded"`) stays exactly as it appears in the file pre-migration. No renames.
- Imports flip from `@/lib/db` → `@/lib/db-neon` and `@prisma/client` → `@/lib/db-types` / `@/lib/db-enums`.
- No business-logic changes — every path through the function maps 1:1 from old to new.

**Execution note:** Test-first per closure body. Write the smoke test asserting expected SQL result shape against a fixture, run it red, then write the SQL, run green. Catches null/snake_case/boolean coercion drift before deploy.

**Patterns to follow:** `inngest/functions/acquire-surface.ts` is the most callsite-dense file in the cutover; once its translation pattern is established, U8-U11 mostly follow the same shape.

**Test scenarios:**
- Happy path: An `acquire-surface` event with a valid `surfaceId` produces an `AcquisitionJob` row with `status: SUCCEEDED`, matching the pre-migration shape exactly. Use a fixture row from production captured pre-migration.
- Edge case: Idempotency replay — firing the same event twice produces only one job (the second returns the cached job).
- Error path: A surface with no policies (unknown platform) produces an `AcquisitionJob` with `status: DEAD_LETTER` and `failureCode: "all_routes_failed"`.
- Integration: `acquire-surface` SUCCESS triggers `acquisition/posts.recategorize-requested` event (verify via Inngest dashboard or direct event log; this remains untouched by U6 and serves as the U8 trigger.)

**Verification:**
- The PR's preview build passes `pnpm typecheck` and `pnpm lint`.
- Manual `curl -X POST $PREVIEW_URL/api/cron/acquire-due -H "Authorization: Bearer $CRON_SECRET"` produces the same `enqueued` count it would have pre-migration.
- After merge: 24-hour soak. Next-morning cron run completes green in the Inngest dashboard. Spot-check ≥3 fresh `AcquisitionJob` rows match shape and status of pre-migration baseline.
- No new `FAILED` jobs introduced vs the day before the PR.

---

- U7. **H1 schema migration**

**Goal:** Land the Account / ConsultingEngagement / BundleSeat tables as a SQL migration in `db/migrations/`. Extends `lib/db-types.ts` with the new types so any new code can query the H1 tables via neon-serverless from day one.

**Requirements:** R6 (H1 ships during cutover, not after).

**Dependencies:** U6 (so the SQL-migrations workflow is proven by Batch 1's verification).

**Files:**
- Create: `db/migrations/2026-XX-XX-h1-consulting-attach.sql` (exact date filled in at PR time)
- Modify: `db/schema.sql` (append the new CREATE TABLE blocks so the canonical artifact stays current)
- Modify: `lib/db-types.ts` (add `Account`, `ConsultingEngagement`, `BundleSeat` row types)
- Test: `lib/__tests__/h1-schema.smoke.ts` (verify tables exist, FK constraints work, indices are created)

**Approach:**
- Column shapes, constraints, and indices are decided in the **separate H1 model-design brainstorm** (deferred follow-up). This implementation unit ships whatever that brainstorm produces.
- Foreign keys: `ConsultingEngagement.accountId` → `Account.id`; `BundleSeat.accountId` → `Account.id`; `BundleSeat.surfaceId` → `Surface.id` (existing); `BundleSeat.engagementId` → `ConsultingEngagement.id`.
- Apply via `psql $DATABASE_URL -f db/migrations/<filename>.sql`. No down migration in this initial cut — H1 is additive only.

**Patterns to follow:** `prisma/schema.prisma` model-definition style for column ordering (id, foreign keys, business fields, timestamps).

**Test scenarios:**
- Happy path: After applying the migration, `INSERT INTO "Account" (...) VALUES (...) RETURNING id` succeeds.
- Edge case: `INSERT INTO "ConsultingEngagement"` with a non-existent `accountId` fails with FK violation.
- Integration: Querying `BundleSeat` with `JOIN Surface ON BundleSeat."surfaceId" = Surface.id` returns rows when both exist.

**Verification:**
- The migration applies cleanly to production (run by hand post-merge, not via auto-deploy).
- `db/schema.sql` updated to reflect the new tables.
- `pnpm typecheck` passes with the new types in `lib/db-types.ts`.

---

- U8. **Batch 2 — ingestion side-channels**

**Goal:** Migrate `lib/ingestion/pipeline.ts` (7 ops) and the `recategorize` / `metric-recompute` Inngest functions to neon-serverless. Verifies the post-acquire fan-out (acquire-surface SUCCESS → recategorize → metric-recompute) end-to-end.

**Requirements:** R3, R4, R5, R7.

**Dependencies:** U6, U7 (H1 must exist before any callsite that might join to it; defensively, even though no Batch-2 callsite touches H1 today).

**Files:**
- Modify: `lib/ingestion/pipeline.ts`
- Modify: `lib/discovery/engine.ts`
- Modify: `inngest/functions/recategorize.ts`
- Modify: `inngest/functions/metric-recompute.ts`
- Test: `lib/__tests__/recategorize-shape.smoke.ts`, `lib/__tests__/metric-recompute-shape.smoke.ts`

**Approach:**
- Same per-call closure-body swap as U6; identical step.run identifiers.
- `recategorize.ts` and `metric-recompute.ts` are simpler than `acquire-surface.ts` (fewer state mutations); the U6 patterns transfer directly.

**Execution note:** Test-first per file.

**Patterns to follow:** U6 is the template.

**Test scenarios:**
- Happy path: A successful `acquire-surface` run fires `recategorize`, which produces a non-empty `Metric` upsert for the affected employee.
- Edge case: A `recategorize` event for an `employeeId` with no posts produces zero metric rows but does not throw.
- Integration: `acquire-surface` SUCCESS → `recategorize` → `metric-recompute` chain runs end-to-end with all three functions on neon-serverless and `AcquisitionJob` / `Post` / `Metric` rows are written correctly.

**Verification:**
- 24-hour soak post-merge. Next-day's `Metric` rows look correct vs the day before.
- No new errors in Inngest's `recategorize` or `metric-recompute` function dashboards.

---

- U9. **Batch 3 — backfill scripts**

**Goal:** Migrate `scripts/backfill-acquisition.ts`, `scripts/backfill-x.ts`, `scripts/discover-surfaces.ts`, and `lib/acquisition/companyMetrics.ts` to neon-serverless.

**Requirements:** R3.

**Dependencies:** U8.

**Files:**
- Modify: `scripts/backfill-acquisition.ts`
- Modify: `scripts/backfill-x.ts`
- Modify: `scripts/discover-surfaces.ts`
- Modify: `lib/acquisition/companyMetrics.ts`
- Test: each script gets a `*.smoke.ts` companion that asserts the script's output for a small fixed input

**Approach:**
- Scripts are simpler — no Inngest step.run wrapping. Direct sql template-literal calls.
- `lib/acquisition/companyMetrics.ts` has 2 ops; mirror Batch-1 patterns.

**Execution note:** Run each script against a Neon scratch branch end-to-end before merging.

**Patterns to follow:** U6, U8.

**Test scenarios:**
- Happy path: Each script executes against a scratch DB and produces the same row counts / shapes as the pre-migration version.
- Edge case: Script run with `surfaceId` that doesn't exist exits with a recognizable error.

**Verification:**
- Each script run produces zero new `RUNNING`-state orphans.
- Manual: `pnpm db:backfill` on a scratch DB matches the pre-migration row count.

---

- U10. **Batch 4 — sync + admin**

**Goal:** Migrate `scripts/sync-from-sheets.ts` (3 ops) and `scripts/seed-employees.ts` (2 ops) to neon-serverless.

**Requirements:** R3.

**Dependencies:** U9.

**Files:**
- Modify: `scripts/sync-from-sheets.ts`
- Modify: `scripts/seed-employees.ts`
- Test: `scripts/__tests__/sync-from-sheets.smoke.ts`

**Approach:**
- Same patterns as U9.
- `sync-from-sheets.ts` does 3 upserts — mirror Batch-1 upsert SQL.

**Patterns to follow:** U9.

**Test scenarios:**
- Happy path: One full sheets sync run produces the expected `Employee` count vs the source spreadsheet.
- Edge case: A row in the sheet with a missing required field is skipped without crashing.

**Verification:**
- `pnpm sync:sheets` against a scratch branch matches the spreadsheet of record.
- `Employee` row count and `Surface` row count post-run match expected.

---

- U11. **Batch 5 — `seed.ts` port to `db/seed.ts` with `pg`**

**Goal:** Port `prisma/seed.ts` (39 ops) to `db/seed.ts` using `pg` over the Pooler URL with a single `BEGIN ... COMMIT` block. This is the heaviest unit in the cutover.

**Requirements:** R3, plus the explicit `pg`-for-transactions decision.

**Dependencies:** U10.

**Files:**
- Create: `db/seed.ts`
- Delete: `prisma/seed.ts` (in this PR; the broader `prisma/` directory deletion is U12)
- Modify: `package.json` — `db:seed` script changes from `tsx prisma/seed.ts` → `tsx db/seed.ts`
- Test: `db/__tests__/seed.smoke.ts`

**Approach:**
- Use `new Client({ connectionString: env.DATABASE_URL })` from `pg`. `await client.connect()`, `await client.query("BEGIN")`, run the 39 ops, `await client.query("COMMIT")`, `await client.end()`. Wrap in try/catch with `ROLLBACK` on error.
- Convert each Prisma op to a parameterized `client.query("INSERT ... RETURNING ...", [params])` call. Capture `RETURNING id` from upstream inserts to use in downstream FK references.
- Order matters: Companies → Employees → Surfaces → Plays → AcquisitionJobs (existing seed order, preserved exactly).

**Execution note:** Test-first via a fresh Neon branch. Drop-and-rebuild the schema, then run `pnpm db:seed`, then assert exact row counts per table. If any count is off by 1, halt — that's a translation error.

**Patterns to follow:** `prisma/seed.ts` for the order and content of inserts; `pg` documentation for the transaction wrapper.

**Test scenarios:**
- Happy path: Fresh Neon branch + `pnpm db:seed` produces exact row counts per table matching a known-good snapshot (captured pre-migration).
- Error path: Mid-seed failure (simulated by inserting a duplicate unique-key) triggers `ROLLBACK` and leaves zero rows in any table.
- Integration: After successful seed, querying via `lib/db-neon.ts` returns rows in the expected shape (i.e., the hand-written types match what `pg` wrote).

**Verification:**
- Drop a fresh Neon branch, apply `db/schema.sql`, run `pnpm db:seed`, query each table — counts match snapshot exactly.
- `prisma/seed.ts` no longer exists.

---

- U12. **Closing PR — delete Prisma**

**Goal:** Remove `@prisma/client`, `@prisma/adapter-pg`, and `prisma` from `package.json`. Delete the `prisma/` directory. Rewrite `lib/db.ts` to re-export from `lib/db-neon.ts` so any lingering `@/lib/db` imports keep working transparently.

**Requirements:** R1, R2.

**Dependencies:** U11. ≥1-week soak after U11 lands.

**Files:**
- Modify: `package.json` — remove `@prisma/client`, `@prisma/adapter-pg`, `prisma`. Remove `postinstall: prisma generate`. Remove `prisma:validate`, `prisma:generate`, `db:studio`. Delete `db:push` if not already done in U2.
- Delete: `prisma/schema.prisma`
- Delete: `prisma.config.ts`
- Delete: `prisma/migrations/` (history was already moved to `db/migrations/` in U2; this is the residual delete)
- Delete: `lib/prisma.ts`
- Modify: `lib/db.ts` — rewrite to `export { sql } from "@/lib/db-neon"`
- Test: `lib/__tests__/db-shim.smoke.ts` — assert that legacy `import { db } from "@/lib/db"` still resolves cleanly (or document that it's intentionally removed)

**Approach:**
- Run `pnpm remove @prisma/client @prisma/adapter-pg prisma`.
- Verify `pnpm typecheck` passes after deletion. Any remaining import of `@prisma/client` is a bug — catch it here.
- A grep sweep: `grep -rln 'prisma\|@prisma' app/ lib/ inngest/ scripts/` returns zero (or only this comment, in code-comments).

**Patterns to follow:** None — this is a removal PR.

**Test scenarios:**
- Happy path: After removal, `pnpm install` completes without error, `pnpm typecheck` passes, `pnpm lint` passes.
- Integration: Production Vercel deploy of this PR succeeds; cron continues firing; Inngest queue continues processing.

**Verification:**
- `cat package.json | grep -i prisma` returns zero.
- `ls prisma/` errors with "no such file."
- 1-week soak post-merge. No `acquire-surface`, `recategorize`, or `metric-recompute` errors above the pre-migration baseline.

---

## System-Wide Impact

- **Interaction graph:** Every Inngest function (`acquire-surface`, `recategorize`, `metric-recompute`) and every API route under `app/api/` that touches the DB. Identical step.run names mean Inngest replay is unaffected, but mid-deploy in-flight runs are still the highest-risk single window.
- **Error propagation:** Prisma exceptions (`PrismaClientKnownRequestError`, `PrismaClientValidationError`) are replaced with `pg` / `@neondatabase/serverless` exceptions. Any `try/catch` block that narrows on Prisma error classes (sweep `lib/`, `inngest/`, `app/api/` during U6 and again at U12) needs the catch updated to match the new error shapes — likely simpler `Error` shape with a `.code` string from PostgreSQL.
- **State lifecycle risks:** During coexistence, two clients hold connections to the same Neon DB — both pooled via `@prisma/adapter-pg` and `neonConfig.fetchConnectionCache`. No expected pool-exhaustion concern given Neon's pooler, but worth noting for ops monitoring.
- **API surface parity:** `/api/cron/acquire-due`, `/api/ingest`, `/api/discover`, `/api/agent` (Bobbito stub — unchanged) all keep their public contracts. No client-facing API change.
- **Integration coverage:** The smoke tests added per batch verify per-callsite shape but don't simulate a deploy mid-Inngest-run. That scenario is exercised by ordinary cron firing during the soak window — soak windows are the integration test for replay safety.
- **Unchanged invariants:** The Inngest event schema (`acquisitionSurfaceRequested`, `postsRecategorizeRequested`, `metricsRecomputeRequested` in `inngest/client.ts`) does not change. The Vercel cron schedule in `vercel.json` does not change. The Bobbito `<ReadWith>` UI surface does not change.

---

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Inngest replay breaks because a step.run identifier was accidentally renamed during a callsite swap | Med | High | Code-review checklist item: "no step.run name renames in this PR." Lint rule (post-cutover): forbid string-literal changes inside `step.run("…")` calls in PRs labeled `migration`. |
| Mid-deploy in-flight `acquire-surface` run completes with mixed Prisma + neon-serverless reads in the same job | Low | Med | Idempotency keys ensure that a re-fired job doesn't double-write. Worst case: the job marks `FAILED` and gets retried by Inngest. |
| Hand-written types in `lib/db-types.ts` drift from `db/schema.sql` | Med | Med | Each PR that modifies the schema must also modify `lib/db-types.ts`; PR template adds this as a checklist item. Smoke tests catch shape drift at typecheck time. |
| `pg`-based seed.ts hangs because of Vercel runtime connection lifecycle | Med | Low | seed runs locally + in CI only, never in Vercel runtime. Explicit `await client.end()` in `finally` block. |
| H1 SQL migration applied out-of-order with U6 deploy | Low | High | H1 (U7) is gated behind U6's 24-hour soak; ops applies H1 SQL by hand, not auto-deploy. |
| `DATABASE_URL` env-config fix (U1) accidentally exposes a different Neon DB than intended (e.g., user pastes the wrong value during `vercel env add`) | Low | High | Verify post-add with `vercel env ls` and a dummy preview build; cross-check the value against `MOODY_DATABASE_URL` (already global) before pasting. |
| Cumulative coexistence-period bundle size makes Vercel build slower | Low | Low | Acceptable for ~3-4 weeks. Verify no Function size limit breach (Vercel hobby tier ~50 MB compressed). |

---

## Phased Delivery

### Phase 1 — Pre-cutover scaffolding (U1-U5)
- One ops change (U1) followed by 4 sequential PRs (U2, U3, U4, U5).
- Each PR ≤24 hours of soak before the next opens, except U1 which can be verified within minutes.
- **Exit criterion:** `lib/db-neon.ts` is wired up and provably-functional (smoke test green) but no production callsite uses it yet.

### Phase 2 — Cutover (U6-U11)
- 6 sequential PRs in strict dependency order.
- Each per-batch PR ≥24 hours of production soak before the next opens.
- H1 (U7) ships between U6 and U8 as a separate ops-applied SQL migration.
- **Exit criterion:** All 63 callsites use neon-serverless. Prisma is still in `package.json` but no callsite imports from it.

### Phase 3 — Cleanup (U12)
- 1 closing PR after ≥1 week of soak following U11.
- **Exit criterion:** `pnpm install` no longer pulls Prisma. `pnpm typecheck`, `pnpm lint`, `pnpm dev`, and the Vercel deploy all pass.

---

## Documentation / Operational Notes

- After U2 lands, update `docs/specs/PRINCIPAL_ENGINEER_BUILD_SPEC.md` (~1 paragraph) noting that schema changes ship as raw SQL files in `db/migrations/`, not via `prisma migrate`.
- After U12 lands, update `README.md` to remove any Prisma setup steps and document the new `pnpm db:seed` flow.
- Post-cutover: open a follow-up issue tracking whether to delete `pg` from deps once `seed.ts` ergonomics are validated for ≥1 month in production.
- Operational monitoring during cutover: watch the Inngest dashboard's `acquire-surface` function for any new `FAILED` jobs above the pre-migration baseline. Watch Neon's Pool Capacity metric for any saturation.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-30-prisma-to-neon-serverless-migration-requirements.md](../brainstorms/2026-04-30-prisma-to-neon-serverless-migration-requirements.md)
- Existing Phase 3 plan (superseded by this plan): `~/.claude/plans/memoized-soaring-narwhal.md`
- Critical files referenced: `inngest/functions/acquire-surface.ts`, `lib/acquisition/policies.ts`, `lib/intent/__tests__/classify.smoke.ts`, `lib/env.ts`, `prisma/seed.ts`, `package.json`, `vercel.json`
- Vercel env config baseline (verified 2026-04-30): `DATABASE_URL` exists only on `Preview (phase-4b-x-real-data)`; `MOODY_DATABASE_URL` is global. PR #20's preview failure traces to this asymmetry.
