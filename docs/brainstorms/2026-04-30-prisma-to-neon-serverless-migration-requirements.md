# Prisma → @neondatabase/serverless migration

**Date:** 2026-04-30
**Status:** Brainstorm complete. Hand off to `/ce-plan`.
**Related:** `~/.claude/plans/memoized-soaring-narwhal.md` (existing 3-phase plan; this supersedes its Phase 3)

---

## Context

The North Star — explicit per the operator: **compounding experiments → consultative headcount subscriptions over time.** Every Court Vision is the surface-IQ instrumentation layer for that loop:

- The acquisition pipeline (`inngest/functions/acquire-surface.ts`, 9 providers under `lib/acquisition/providers/`) is the *compounding experiments* engine — every public post / commit / podcast appearance from every Every staffer becomes a structured signal.
- The publication chrome (`app/overview/`, `components/essay/`, the Bobbito named-agent CTA at `app/api/agent/route.ts`) is the *legibility layer* — what Austin's team and external readers see.
- The currently-missing piece is the *consulting → bundle-seat* attribution: H1 in the dossier (`Account` / `ConsultingEngagement` / `BundleSeat` models). Without it, the loop closes in marketing language but not in the schema.

The Prisma → `@neondatabase/serverless` migration is in the way of that loop closure for two reasons:
1. Prisma 7.8.0 already broke the snapshot of older code on the `keegan/backup-2026-04-28-r8e8` branch (`url` and `directUrl` removed from `schema.prisma`). Future framework moves will keep breaking on Prisma's release cadence.
2. Adding H1 tables via Prisma now means those tables get a Prisma codegen entry that has to be removed in three weeks anyway. Better to pre-establish SQL-as-source-of-truth so H1 ships once, in its final form.

This document captures **what** the migration must achieve and **what's in / out**. Implementation specifics belong in the plan.

---

## Goal

Replace `@prisma/client` + `@prisma/adapter-pg` with direct `@neondatabase/serverless` queries across all 63 ORM callsites (10 files), with **zero acquisition-pipeline downtime** and **zero in-flight Inngest job loss**, in a way that lets H1 attach-rate models ship during the cutover rather than after.

End state:
- `package.json` has `@neondatabase/serverless` and not `@prisma/client` / `@prisma/adapter-pg` / `prisma`
- `db/schema.sql` is the canonical schema artifact; `prisma/` directory is deleted
- New schema changes ship as raw SQL files in `db/migrations/`
- All callsites use `sql\`…\`` template-literal queries with hand-written row types from `lib/db-types.ts`
- The Vercel cron + Inngest queue runs identically to today, observable in the Inngest dashboard, with `AcquisitionJob` rows created identically to the pre-migration baseline

---

## Strategy: per-call swap with identical step.run names (Strategy B)

For each callsite migrated, the surrounding `step.run("step-name", fn)` identifier stays byte-identical; only the closure body changes from `db.X.Y(...)` (Prisma) to `await sql\`…\`` (neon-serverless). Inngest's deterministic-replay tolerates closure swaps as long as step names and shape are stable, so any in-flight `acquire-surface` run during a deploy resumes safely.

**Why not the alternatives** (rejected this turn):
- *Drain-and-flip (A):* one big-bang deploy with ~30 min acquisition pause. Cleaner end state, but every batch landing means another big-bang. Per-call swap pays the verification cost up front and keeps each batch revertable.
- *Prisma-shape adapter shim (C):* build a neon-backed adapter that quacks like `db.X.Y(...)`, switch Prisma → shim via env flag. Zero callsite churn, but ~1 week of throwaway scaffolding and risk of subtle Prisma-vs-shim semantic drift (`findFirst` ordering, null vs undefined coercion, transaction boundaries).

---

## Pre-cutover (must ship before any callsite swap)

These are preconditions, not part of the cutover itself.

1. **Vercel env-config consolidation.** `DATABASE_URL` is currently set only on the `phase-4b-x-real-data` preview branch. Promote to all preview environments + production (it's already there for production). Without this, every non-`phase-4b` preview build fails at `lib/env.ts:46` with "Invalid environment configuration" — already observed on the `salvage/every-folder-specs` branch's two attempted previews.
2. **Snapshot SQL.** Run `pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > db/schema.sql`. Move existing `prisma/migrations/` → `db/migrations/` (preserves history; do not delete). Disable `prisma migrate` in any CI / pre-commit hooks.
3. **Hand-written row types scaffold.** Create `lib/db-types.ts` with TypeScript types for the 25 Prisma models. Auto-derived from the SQL schema by hand (no codegen). Export each as a named type matching the Prisma model name so callsite migration is a one-line change per query (`AcquisitionJob` from `@prisma/client` → `AcquisitionJob` from `@/lib/db-types`).
4. **Enum const-unions.** `lib/db-enums.ts` mirroring the 8 Prisma enums (`Platform`, `MetricConfidence`, `DataReadiness`, `SourceReadiness`, `AcquisitionProvider`, `AcquisitionJobStatus`, `IntentClass`, `ShotOutcome`). 42 import sites get rewritten from `@prisma/client` → `@/lib/db-enums` in a single mechanical PR.
5. **`lib/db-neon.ts` scaffold.** Exports `sql` from `@neondatabase/serverless` configured with `neonConfig.fetchConnectionCache = true`. Does NOT replace `lib/db.ts` yet — that import alias still points to Prisma until the cron-path callsites migrate.

---

## Cutover order

| Batch | Surface | Verification gate |
|---|---|---|
| **1. Cron path** | `app/api/cron/acquire-due/route.ts`, `app/api/ingest/route.ts`, `app/api/discover/route.ts`, `inngest/functions/acquire-surface.ts` | Next-morning Vercel cron run completes green in the Inngest dashboard. Manual `curl -X POST /api/cron/acquire-due -H "Authorization: Bearer $CRON_SECRET"` post-deploy. Spot-check ≥3 fresh `AcquisitionJob` rows match shape + status of pre-migration baseline (compare against `keegan/backup-2026-04-28-r8e8` branch's last successful run if needed). |
| **2. Ingestion side-channels** | `lib/ingestion/pipeline.ts` (7 ops), `lib/discovery/engine.ts` (1 op), `inngest/functions/recategorize.ts`, `inngest/functions/metric-recompute.ts` | One trip through the post-acquire fan-out: an `acquire-surface` SUCCESS → `acquisition/posts.recategorize-requested` → `acquisition/metrics.recompute-requested`, all observable in Inngest dashboard. |
| **3. Backfill scripts** | `scripts/backfill-acquisition.ts` (2 ops), `scripts/backfill-x.ts` (2 ops), `scripts/discover-surfaces.ts` (1 op), `lib/acquisition/companyMetrics.ts` (2 ops) | Each script run produces zero `RUNNING`-state orphans and zero new `FAILED` jobs vs pre-migration. |
| **4. Sync + admin** | `scripts/sync-from-sheets.ts` (3 ops), `scripts/seed-employees.ts` (2 ops) | One full sheets sync run; verify `Employee` row count + `Surface` row count vs spreadsheet of record. |
| **5. seed.ts (last)** | `prisma/seed.ts` → ported to `db/seed.ts` (39 ops). | Drop a fresh Neon branch, run `pnpm db:seed`, verify exact row counts per table match a known-good seed snapshot. Whether `db/seed.ts` uses `pg` for true transactions or `neon.transaction([…])` for sequential atomicity is a **plan-tier** decision, not brainstorm-tier. |

After Batch 5: delete `@prisma/client`, `@prisma/adapter-pg`, `prisma`, `prisma.config.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, and `prisma/migrations/` (migration history was already moved to `db/migrations/` in pre-cutover step 2). Ship the `package.json` cleanup as the closing PR.

---

## H1 timing during cutover

H1 (Account / ConsultingEngagement / BundleSeat) is the consulting-attach-rate schema. Per the North Star, this is the highest-leverage feature waiting on the migration.

**Decision:** H1 ships **between Batch 1 and Batch 2** as its own SQL migration in `db/migrations/`. Rationale:
- After Batch 1, the cron path is already querying via neon-serverless, so the new tables can be queried by the same client without re-doing the cutover for them.
- H1 doesn't have any Prisma callsites to migrate (the tables don't exist yet), so it lives 100% in the new world from day one.
- Shipping H1 mid-cutover proves the SQL-migrations workflow end-to-end before we get to the riskier batches (3, 4, 5).
- Austin's Campaign Reporter starts seeing attach-rate signal ~3 weeks earlier than if we waited for the full Prisma rip.

H1 model design (column shapes, constraints, indices, foreign keys to `Surface` / `Employee` / `AcquisitionJob`) is **out of scope for this brainstorm** — it gets its own brainstorm or its own Phase 4 plan section.

---

## Per-batch verification gate (template)

Every PR in the migration must:
1. Pass `pnpm typecheck` and `pnpm lint`.
2. Add at least one snapshot test for each new SQL query, asserting row shape against a known-good fixture. The test guards against null vs undefined drift, snake_case vs camelCase column drift, and boolean coercion drift — the three failure modes most likely to escape compile-time checks.
3. Soak in production for ≥24 hours after merge before the next batch's PR opens. The soak window is non-negotiable — it's the only signal that catches Inngest replay-shape errors that don't show up in pre-merge testing.
4. Be revertable via `git revert <PR-sha>` with no schema implications. Identical step.run names + same row types means the Prisma-side closure can return as-is.

Rollback: any batch's PR is `git revert <sha>` away from prior state. The last-deleted-Prisma PR is the only one that's not trivially revertable; it gets extra scrutiny + a longer soak window (≥1 week).

---

## Coexistence period

During Batches 1–5 (estimated 3–4 weeks total wall-clock), `package.json` carries both `@prisma/client` (`@prisma/adapter-pg`, `prisma`) and `@neondatabase/serverless`. Bundle size is temporarily larger, two clients open connections to the same Neon DB. This is acceptable; the deletion happens as the closing PR.

`schema.prisma` is frozen — no Prisma migrations are generated during cutover. All schema changes (H1, plus any incidental tweaks) ship as numbered SQL files in `db/migrations/`.

---

## Out of scope

- **Drizzle ORM** — already ruled out; we're going to raw SQL via neon-serverless, not a different ORM.
- **Drain-and-flip (Strategy A)** and **adapter shim (Strategy C)** — rejected this turn.
- **H1 model design** — only timing decided here.
- **Bobbito agent integration** beyond the existing 202-stub at `app/api/agent/route.ts:1` — separate brainstorm.
- **Two-audience publication chrome** (Notion+Slack for Austin vs. Next.js publication for external readers) — separate brainstorm.
- **WEDGE_MAP "what's your stack costing you?" tool** at `docs/strategy/WEDGE_MAP.md:160` — separate brainstorm.
- **Inngest dev environment migration** — assumed dev uses neon-serverless from day 1, no separate cutover.
- **Test framework choice** — plan-tier.
- **`pg` (node-postgres) deletion** — defer to plan; `seed.ts` may need `pg` for true transactions.
- **Vercel deployment-protection toggle** for the production URL (currently 401-gated) — operations decision, not a migration decision.

---

## Open assumptions (flag any of these in plan-tier review)

1. Coexistence runs ~3–4 weeks. If H1's business value pulls forward, this can compress to 2 weeks by parallelizing Batches 3 and 4.
2. Each PR's snapshot test is implementation-cheap (one fixture file per query). If the test framework decision delays Batch 1 by more than a day, defer the snapshot-test requirement to Batch 2 onward and use manual SQL diffing for Batch 1.
3. Rollback per batch is `git revert`. This holds if and only if step.run identifiers are byte-identical; any rename of a step name during a batch breaks rollback safety. Discipline check at code-review time.
4. The Vercel env-config fix (`DATABASE_URL` global) is non-destructive and ships as ops work, not a migration PR.
5. `pg_dump --schema-only` produces SQL that matches what Prisma's introspection would generate. If there's drift (relations, indices, default values), the canonical `db/schema.sql` is the SQL output, not the Prisma version.

---

## Files affected (repo-relative)

**Pre-cutover scaffolding:**
- `db/schema.sql` (new)
- `db/migrations/` (new; previous `prisma/migrations/` moved here)
- `lib/db-types.ts` (new)
- `lib/db-enums.ts` (new)
- `lib/db-neon.ts` (new)

**Per-batch swaps:**
- Batch 1: `app/api/cron/acquire-due/route.ts`, `app/api/ingest/route.ts`, `app/api/discover/route.ts`, `inngest/functions/acquire-surface.ts`
- Batch 2: `lib/ingestion/pipeline.ts`, `lib/discovery/engine.ts`, `inngest/functions/recategorize.ts`, `inngest/functions/metric-recompute.ts`
- Batch 3: `scripts/backfill-acquisition.ts`, `scripts/backfill-x.ts`, `scripts/discover-surfaces.ts`, `lib/acquisition/companyMetrics.ts`
- Batch 4: `scripts/sync-from-sheets.ts`, `scripts/seed-employees.ts`
- Batch 5: `prisma/seed.ts` → `db/seed.ts`

**Closing PR (after Batch 5):**
- `package.json` (remove `@prisma/client`, `@prisma/adapter-pg`, `prisma`)
- `prisma.config.ts` (delete)
- `prisma/schema.prisma` (delete)
- `prisma/seed.ts` (delete)
- `prisma/migrations/` (delete)
- `lib/prisma.ts` (delete)
- `lib/db.ts` (rewrite to re-export from `lib/db-neon.ts`)

**H1 (between Batch 1 and Batch 2):**
- `db/migrations/2026-XX-XX_h1_consulting_attach.sql` (new)
- `lib/db-types.ts` (extend with `Account`, `ConsultingEngagement`, `BundleSeat` row types)

**Verification:**
- Each PR adds at least one fixture file under `__tests__/` or equivalent for the queries it migrates.

---

## Next steps

1. Hand off to `/ce-plan` with this document as input. The plan should answer: which test framework, exact `pg`-vs-neon decision for `seed.ts`, exact H1 migration SQL, and the precise sequence of PRs (which is which batch).
2. Before plan-time, fix the Vercel env-config gap (precondition step 1) so `salvage/every-folder-specs` (PR #20) can preview-build green and the operations baseline is sane.
3. Optional: open a separate brainstorm for H1 model design once the migration's plan is ready, so H1's PR can ship the day Batch 1 lands.
