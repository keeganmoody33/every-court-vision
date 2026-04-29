# Codex — Phase 4B-X: Real X data end-to-end + reconcile the two ingestion pipelines

> **Canonical location: this file (`docs/codex/phase-4b-x-provider.md`).** Cloud Codex agents read it from the working tree. A mirror lives at `~/.claude/plans/phase-4b-x-provider-codex-prompt.md` for local Claude Code plan-mode sessions. If you edit one, propagate to the other; the in-repo copy wins on conflict.

---

> **You are an autonomous engineer.** This prompt is the entire briefing. You are expected to ship a mergeable PR in one pass. No partial commits, no asking for clarification. If you're stuck, follow the *Stop Conditions* at the bottom — don't guess.

---

## 0. Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Working dir** | `/Users/keeganmoody/Documents/New project` (or fresh clone in `/tmp/` — see *Local FS hang*) |
| **Branch from** | `main` (currently `78186c1`) |
| **Branch to create** | `phase-4b-x-real-data` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only. Never `npm`. Never `pnpm dlx`. |
| **Runtime** | Node 22, Next 16 App Router, React 19, TS strict, Prisma 7 |
| **Database** | Neon Postgres. `DATABASE_URL` is in `.env.local`. Schema is up to date as of commit `7e30fd5` (Phase 5 migrations already applied). |
| **Required env** | `X_API_KEY` (Twitter API v2 Bearer token; renamed from `X_BEARER_TOKEN` in PR #11) |

**Local FS hang note.** The dev's working dir hangs `tsc` and `prisma`. If you're on the host machine and `pnpm typecheck` stalls at 0% CPU after 30s, switch to a `/tmp/` clone.

**State of the repo as of this prompt.** Phases 0, 1, 1.5, 2, 3a, 3b, 5-discovery, and Devin's wire-providers PR (#11) are all on `main`. The X provider (`lib/acquisition/providers/x.ts`) is **108 lines of real Twitter API v2 code Devin shipped**. There is also a parallel `lib/ingestion/pipeline.ts` Devin built that writes to a separate `RawPost` staging path and is invoked via `scripts/ingest-all.ts`. **Both paths exist. Neither has been run end-to-end against Neon. Neither has populated real `Post` rows the UI can render.** Your job is to make one of them work all the way through, and reconcile them.

---

## 1. The mission, in one sentence

**Replace the seeded X posts in the dashboard with real Twitter data** — by running Devin's X provider end-to-end against Neon for all 16 employees, verifying real tweets render on `/shot-plot` and `/court-heat`, deleting mocked X posts from the seed, and reconciling the two parallel ingestion pipelines (`lib/acquisition/*` vs `lib/ingestion/*`) so future surface work picks one path, not both.

---

## 2. The architectural decision (LOCKED before you write code)

**Canonical path = `lib/acquisition/*`.** Reasoning:

- It writes directly to the `Post` model via `lib/acquisition/persist.ts`, which already runs intent classification (`classifyIntent`), court mapping (`postToCoord`), outcome classification (`classifyOutcome`), and metric scoring (`socialTS`, `trustGravityScore`, `assistRate`). The UI reads from `Post`, so this path is what the dashboard sees.
- It's wired through the policy chain in `lib/acquisition/policies.ts` and the router in `lib/acquisition/router.ts` — multi-provider fallback is already designed for it.
- Phase 4A (Inngest queue migration, `docs/codex/phase-4a.md`) is built ON TOP of `lib/acquisition/router.ts`. Future cron + queue work assumes this path.

**`lib/ingestion/pipeline.ts` is a parallel implementation that writes to `RawPost` (a staging model the UI does not currently render).** It was useful as a quick batch script but creates drift. **In this PR you absorb its useful pieces into `lib/acquisition/*` and remove the duplication.**

Specifically:
- Anything in `lib/ingestion/pipeline.ts` that does API fetching that DOESN'T duplicate `lib/acquisition/providers/*.ts` (e.g. company-level YouTube subscriber count writes, channel-level metadata) gets extracted into a small `lib/acquisition/companyMetrics.ts` module called from a wrapper script.
- Anything that duplicates a provider (e.g. an X fetch path) gets deleted; the canonical provider in `lib/acquisition/providers/x.ts` wins.
- `scripts/ingest-all.ts` is rewritten to call `runAcquisitionForSurface()` from `lib/acquisition/router.ts` for each Surface, NOT `runFullIngestion()` from `lib/ingestion/pipeline.ts`.
- `lib/ingestion/pipeline.ts` is deleted at the end of this PR (after all useful pieces are extracted).

**If you find a piece of `lib/ingestion/` that doesn't fit either bucket above (e.g. it writes to a model that doesn't exist in `lib/acquisition/`), STOP and report — don't guess at the right home.**

---

## 3. The hard contract

What you may NOT regress:

- **Phase 3a/3b visual layer** — `HeatMapCourt`, `ShotPlot`, `AssistArc`, `PassingLane`, `IntentFilterChips`, every essay primitive, every `lib/intent/*` module. Read-only.
- **Phase 1.5 sourceId synth flag.** When you write a Post via the canonical path, `persist.ts` already sets `sourceId = "acquired:X_API:<tweet_id>"` (verify this via inspection). The `<SyntheticPill>` stops rendering. Don't break this.
- **Phase 5 discovery infrastructure.** `scripts/discover-surfaces.ts`, `scripts/seed-employees.ts`, the `prisma/migrations/20260429103000_add_discovery_models/` migration, and `lib/discovery/*` (if present) are read-only.
- **Devin's PR #11 changes:**
  - `X_API_KEY` env var (renamed from `X_BEARER_TOKEN`). Use it; don't rename back.
  - The 108-line X provider in `lib/acquisition/providers/x.ts`. **Read it carefully; you will probably need small fixes (error handling, rate-limit backoff, conversation_id surfacing for assist detection) but you don't rewrite it from scratch.**
  - Any `policies.ts` changes from PR #11.
- **`prisma/schema.prisma`** — read-only for this PR. The schema is rich enough already. If you find you can't ship without a schema change, STOP and report.

What you ARE allowed to touch:
- `lib/acquisition/providers/x.ts` — small fixes only (error handling, rate-limit retry, conversation_id, `note_tweet` long-form support if shipped to the API tier we have).
- `lib/acquisition/persist.ts` — if you find a real bug in the persist path (dedup logic, classification handoff). Document each change in the PR description.
- `lib/acquisition/router.ts` — minor: maybe expose `runAcquisitionForSurface(surfaceId, opts)` as a callable for the script.
- `scripts/ingest-all.ts` — rewrite to call the canonical path.
- `scripts/backfill-x.ts` (NEW) — single-platform backfill helper for X, idempotent.
- `prisma/seed.ts` — DELETE the mocked X posts seeded for the 8 active players. Real data replaces them after backfill.
- `lib/ingestion/pipeline.ts` — DELETE at end of PR after extraction.
- `lib/acquisition/companyMetrics.ts` (NEW, optional) — if and only if `lib/ingestion/pipeline.ts` had useful company-level metric writes (e.g., YouTube subscriber count) that don't fit a provider.

---

## 4. Read first (in order)

1. **[`docs/codex/phase-3b.md`](docs/codex/phase-3b.md)** — same craft applies.
2. **[`docs/codex/phase-4a.md`](docs/codex/phase-4a.md)** — the future queue migration. Don't implement it here, but read so your changes don't conflict.
3. **[`docs/DATA_CONTRACTS.md`](docs/DATA_CONTRACTS.md)** — especially §1 (Made Shot vs Attempt), §2 (Awareness — note the "measured" vs "estimated" labeling), §3 (Social TS%). Your X provider and persist must produce data that satisfies these contracts.
4. **[`lib/acquisition/providers/x.ts`](lib/acquisition/providers/x.ts)** — entire file. Devin's existing implementation.
5. **[`lib/acquisition/types.ts`](lib/acquisition/types.ts)** — `ProviderAdapter`, `RawActivityInput`, `AcquisitionRunResult`. The shape your provider returns.
6. **[`lib/acquisition/persist.ts`](lib/acquisition/persist.ts)** — how `RawActivityInput[]` becomes `Post` rows. You're verifying this end-to-end.
7. **[`lib/acquisition/router.ts`](lib/acquisition/router.ts)** — synchronous walk today. You'll add `runAcquisitionForSurface(surfaceId)` if it doesn't exist as a public export.
8. **[`lib/acquisition/policies.ts`](lib/acquisition/policies.ts)** — confirm X has at least one policy entry pointing at the `X_API` provider.
9. **[`lib/ingestion/pipeline.ts`](lib/ingestion/pipeline.ts)** — entire file. Triage every function. Identify what's worth extracting.
10. **[`scripts/ingest-all.ts`](scripts/ingest-all.ts)** — the existing entry point. You're rewriting it.
11. **[`prisma/seed.ts`](prisma/seed.ts)** — find the X-platform mocked posts. Locate the loop. You'll delete those rows.
12. **[`lib/types.ts`](lib/types.ts)** — `Post`, `PostMetrics`, `Platform`, `SourceReadiness`. The shape Phase 3b's UI consumes.
13. **Twitter API v2 docs** — <https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets> and <https://developer.twitter.com/en/docs/twitter-api/rate-limits>. Especially the rate-limit table for the tier the X_API_KEY is on.

---

## 5. Deliverables (4 items, 1 PR)

### 5.1 Verify + harden the X provider

Read `lib/acquisition/providers/x.ts` line by line. Check for:

- **Error path completeness.** What happens on `429 Too Many Requests`? Today (per file inspection) the provider returns `failed` with `failureCode: "x_timeline_429"`. **Better behavior:** read `x-rate-limit-reset` header, return `failed` with `failureCode: "x_rate_limited"` and `retryAfterSeconds: <reset_in_seconds>`. The Phase 4A queue (when it ships) will use this to schedule a delayed retry.
- **Conversation surfacing.** `tweet.fields=conversation_id` is in the request — confirm the `RawActivityInput` carries `conversation_id` through to the persist path so future assist-detection can use it.
- **Long-form tweets.** If the X_API tier supports it, add `tweet.fields=note_tweet` and use `note_tweet.text` when present, falling back to `text` otherwise.
- **Pagination.** The current code uses `max_results=100`. For 90-day windows on active accounts (Dan Shipper does ~4 tweets/day = ~360 tweets/90d > 100), this loses tweets. Add cursor pagination via `pagination_token` until exhausted or 1000 tweets max per surface. Cap is a safety net; users can lift it via env if needed.
- **Self-retweets.** `exclude=retweets` is set today. Confirm this matches the data contract — retweets without commentary are passes per `docs/DATA_CONTRACTS.md`. Don't change.
- **Replies.** Currently included. Replies count as posts; the intent classifier in `lib/intent/classify.ts` will handle their categorization.

If any of these need code changes, make them in `lib/acquisition/providers/x.ts`. Document each in the PR description with a one-line "why."

### 5.2 Add a single-surface acquisition entry point + X-only backfill script

In `lib/acquisition/router.ts`, ensure there's a public exported function:

```ts
export async function runAcquisitionForSurface(
  surfaceId: string,
  opts?: { windowDays?: number },
): Promise<AcquisitionRunResult>
```

If it already exists, leave it. If not, extract the per-surface logic from the existing `runAcquisition()` (or whatever the current loop is) into this function and have the loop call it.

Create `scripts/backfill-x.ts`:

```ts
// scripts/backfill-x.ts
// Run from project root: pnpm tsx scripts/backfill-x.ts
//
// Idempotent: re-runs short-circuit on existing successful AcquisitionJob rows.
// Reads X_API_KEY from env. Writes real X posts via the canonical
// lib/acquisition/persist.ts path. Replaces (does not augment) any seeded
// X posts for the same employee — the dedupe logic in persist.ts handles
// new tweet IDs; you'll remove the seeded ones in §5.4.

import { db } from "@/lib/db";
import { runAcquisitionForSurface } from "@/lib/acquisition/router";

async function main() {
  const xSurfaces = await db.surface.findMany({
    where: { platform: "X", present: true },
    include: { employee: true },
  });

  console.log(`Found ${xSurfaces.length} X surfaces to backfill (90 days each).\n`);

  let total = 0;
  let succeeded = 0;
  let failed = 0;

  for (const surface of xSurfaces) {
    const handle = surface.handle;
    const name = surface.employee?.name ?? "(unknown)";
    process.stdout.write(`  ${name.padEnd(28)} ${handle.padEnd(28)} `);
    try {
      const result = await runAcquisitionForSurface(surface.id, { windowDays: 90 });
      if (result.status === "SUCCEEDED" || result.status === "PARTIAL") {
        const collected = result.activitiesCollected ?? 0;
        process.stdout.write(`✓ ${String(collected).padStart(4)} tweets\n`);
        total += collected;
        succeeded += 1;
      } else {
        process.stdout.write(`✗ ${result.failureCode ?? "unknown"}\n`);
        failed += 1;
      }
    } catch (err) {
      process.stdout.write(`✗ ${(err as Error).message}\n`);
      failed += 1;
    }
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed, ${total} total tweets persisted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Add `package.json` script: `"backfill:x": "tsx scripts/backfill-x.ts"`.

### 5.3 Reconcile the two ingestion pipelines

This is the architectural cleanup. Per §2's locked decision: `lib/acquisition/*` is canonical; `lib/ingestion/pipeline.ts` is dissolved.

Step by step:

1. **Read every function in `lib/ingestion/pipeline.ts`.** Identify three buckets:
   - **Bucket A — duplicates `lib/acquisition/providers/*.ts`** (e.g. an X fetch path that overlaps with the X provider). DELETE these. The provider wins.
   - **Bucket B — company-level metric writes** (e.g. YouTube channel subscriber count, GitHub org stats). Extract into `lib/acquisition/companyMetrics.ts` as a small set of pure functions: `await syncYouTubeChannelMetrics(channelHandle)`, `await syncGitHubOrgMetrics(orgName)`. Write to the `Company` model.
   - **Bucket C — anything else** (writes to `RawPost`, custom logic that doesn't map). STOP and report; do not delete and do not preserve as-is.

2. **Rewrite `scripts/ingest-all.ts`** to:
   ```ts
   // Single canonical entry point: walks every present Surface, runs
   // runAcquisitionForSurface() for each. Calls company-metric helpers afterward.
   import { db } from "@/lib/db";
   import { runAcquisitionForSurface } from "@/lib/acquisition/router";
   import { syncYouTubeChannelMetrics, syncGitHubOrgMetrics } from "@/lib/acquisition/companyMetrics";

   async function main() {
     const surfaces = await db.surface.findMany({ where: { present: true }, include: { employee: true } });
     // ...for-of loop over surfaces, runAcquisitionForSurface for each, log...
     await syncYouTubeChannelMetrics("EveryInc");
     await syncGitHubOrgMetrics("every-io");
   }
   ```

3. **Delete `lib/ingestion/pipeline.ts`** once Bucket A is removed and Bucket B is extracted.

4. **Update any imports.** `rg "from .*lib/ingestion"` returns zero hits at end of PR.

### 5.4 Replace mocked X posts in the seed

In `prisma/seed.ts`, find the section that seeds X-platform Posts for the 8 active players (Austin, Dan, Kieran, Yash, Naveen, Kate, Katie, Laura). Delete the X-specific seed rows. Keep the Surface rows intact (those are real verified handles from `prisma/fixtures/intel-report.ts`).

After the deletion, the seed leaves X surfaces empty for those 8 players. The `pnpm backfill:x` script (5.2) is what populates them now.

**Sequencing matters:**
1. PR lands.
2. Dev sets `X_API_KEY` in `.env.local` (or Vercel env).
3. `pnpm exec prisma db push` (no schema changes; this is a no-op safety check).
4. `pnpm db:seed` — re-seeds the DB without X mocks. X surfaces exist but have zero Posts.
5. `pnpm backfill:x` — pulls real X data for all 16 X surfaces.
6. Visit `/shot-plot` filtered to X — real tweets render. Numbers don't round.

---

## 6. Test fixtures

After your PR lands and the dev runs the backfill, these should hold:

| Verification | Expected |
|---|---|
| `pnpm backfill:x` (with valid `X_API_KEY`) | Each of the 16 X surfaces logs `✓ N tweets` where N > 0 for active accounts (Dan, Austin, Kieran, Yash, Naveen, Kate, Katie, Lucas, Mike, Rhea, etc.). Inactive or rate-limited surfaces log `✗ x_rate_limited` or `✗ x_timeline_429` and the script keeps going. |
| Without `X_API_KEY` | Each surface logs `✗ x_api_disabled`. No crashes. |
| Re-running `pnpm backfill:x` immediately | No new tweets persisted (idempotency via `Post.externalId` unique constraint). All surfaces log "0 tweets" (the dedup short-circuit). |
| `/shot-plot` filtered to X | Real tweet text visible in `<SidePanel>` on click. `<SyntheticPill>` does NOT render (because `Post.sourceId` starts with `"acquired:X_API:"`). Recency fade visible: today's tweets are full-opacity, 60+ day-old tweets are faded. |
| Austin's Spiral promo tweet (search `/shot-plot` for "@every" or "Spiral") | Plots in the `threePoint` band (intent classifier detected the CTA). Color = `#1DA1F2` (X). |
| Header `Social TS%` (with real X data only) | Drops from the seeded 61.8% to a realistic 2-15% range per `docs/DATA_CONTRACTS.md` §3. |
| `rg "from .*lib/ingestion"` | Returns zero hits across the repo. |
| `lib/ingestion/pipeline.ts` | Does not exist. |
| `pnpm typecheck && pnpm lint && pnpm build` | All clean. |

---

## 7. Self-verification (run in this order; do not skip)

```bash
# from repo root, with X_API_KEY set in .env.local
pnpm install
pnpm exec prisma generate
pnpm exec prisma db push       # confirm no migration drift
pnpm typecheck                  # must pass clean
pnpm lint                       # must pass clean
pnpm build                      # must succeed

# Reconcile check
rg "from .*lib/ingestion" || echo "CLEAN — no ingestion imports remain"
test ! -f lib/ingestion/pipeline.ts && echo "CLEAN — file deleted"

# Reseed without X mocks
pnpm db:seed

# Backfill real X data
pnpm backfill:x | tee /tmp/backfill-x.log

# Inspect: counts in DB
pnpm exec prisma studio &
# Manually verify Post table has rows where sourceId LIKE 'acquired:X_API:%'

# Boot dev + visual smoke
pnpm dev &
DEV_PID=$!
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/shot-plot | grep -qE "^(200|307)$"; do sleep 2; done

# Spot-check the rendered HTML for real tweet text (not seeded text)
curl -s 'http://localhost:3000/shot-plot' | grep -oE "Spiral|@tedescau|Cora" | head -10

# Cleanup
kill $DEV_PID 2>/dev/null
lsof -ti:3000 | xargs -r kill -9 2>/dev/null
```

If any step fails, fix and re-run from the top. Do not commit until everything passes.

---

## 8. PR description template

```
Phase 4B-X: real Twitter data end-to-end + reconcile ingestion pipelines

## Summary
- Hardens Devin's X provider (PR #11) with rate-limit handling, pagination,
  conversation_id passthrough, and long-form tweet support
- Adds runAcquisitionForSurface() public export on lib/acquisition/router.ts
- Adds scripts/backfill-x.ts: idempotent single-platform backfill via canonical path
- Reconciles lib/ingestion/pipeline.ts into lib/acquisition/* (deletes the duplicate;
  extracts company-level metric writes into lib/acquisition/companyMetrics.ts)
- Rewrites scripts/ingest-all.ts to call the canonical path
- Deletes mocked X posts from prisma/seed.ts (real data replaces them via backfill)

## Architectural decision
Canonical acquisition path = lib/acquisition/*. lib/ingestion/pipeline.ts dissolved.
See §2 of docs/codex/phase-4b-x-provider.md for the locked rationale.

## Schema changes
None. (If you found yourself needing one, you should have stopped per §3.)

## Test plan
- [x] pnpm typecheck && pnpm lint && pnpm build clean
- [x] pnpm db:seed runs without X-post inserts
- [x] pnpm backfill:x with valid X_API_KEY: 16 surfaces, ≥1 tweet each for active accounts
- [x] pnpm backfill:x re-run: idempotent (zero new tweets, dedup short-circuit)
- [x] Without X_API_KEY: clean failure per surface, no crashes
- [x] /shot-plot filtered to X: real tweet text visible, SyntheticPill absent
- [x] rg "from .*lib/ingestion" returns 0 hits
- [x] lib/ingestion/pipeline.ts file deleted

## Out of scope (deferred)
- Inngest queue migration (Phase 4A — separate PR)
- LinkedIn manual import path (Phase 4B-LinkedIn)
- GitHub, Newsletter, YouTube, Podcast, Instagram providers (Phase 4B-fan-out)
- Attribution wiring (Phase 4C)
- Bobbito agent (Phase 4D)
```

---

## 9. Hard rules — what you do NOT do

1. **Do not modify** `prisma/schema.prisma`. The schema is locked for this PR.
2. **Do not modify** Phase 3a/3b code (`lib/intent/*`, every visual component, every essay primitive, `SidePanel`, `SyntheticPill`).
3. **Do not modify** Phase 5 discovery code (`scripts/discover-surfaces.ts`, `lib/discovery/*` if present, the discovery migration).
4. **Do not** rewrite the X provider from scratch. Read it, understand it, harden it. Devin shipped a working baseline; don't throw it away.
5. **Do not** rename `X_API_KEY` back to `X_BEARER_TOKEN`. Devin's PR #11 settled this.
6. **Do not** preserve `lib/ingestion/pipeline.ts` "for compatibility." It dissolves entirely. If a piece of it didn't fit Bucket A or Bucket B per §2, STOP and report — don't park it somewhere new.
7. **Do not** commit `.env.local` or any file containing real API keys.
8. **Do not** force-push, amend a pushed commit, or skip pre-commit hooks. PR via `gh pr create`.
9. **Do not** swap to a different API provider (e.g. Twitter API via a third-party gateway). The X_API_KEY is a real Twitter API v2 bearer token; honor that.
10. **Do not** add new dependencies unless absolutely required. The repo has Prisma, fetch, zod. You should not need more.

---

## 10. Stop conditions (when to bail)

- If `lib/acquisition/providers/x.ts` doesn't exist as expected, **stop**. Devin's PR #11 has been merged or doesn't exist; check `git log --oneline | grep -i "wire providers"`. Re-read the prompt's §0 state assertion.
- If `lib/ingestion/pipeline.ts` has writes to a model that doesn't exist anywhere in `prisma/schema.prisma` (suggests a half-shipped feature), **stop**. Don't delete what you can't safely re-home.
- If the dev's `X_API_KEY` is unset and the script fails on the first surface, **stop and report** — the dev needs to provision the key before validating end-to-end. The PR can still be opened but mark it as draft and document what couldn't be smoke-tested.
- If `pnpm backfill:x` runs and the Inngest function is somehow already in play (e.g. Phase 4A merged before this PR did), **stop**. Coordinate with the queue work; don't double-fire acquisitions.
- If `lib/acquisition/persist.ts` is throwing on the data shape Devin's X provider returns, this is the bug fix the prompt's §5.1 anticipates. Fix it; document in PR.

---

## 11. After this merges

The X surface is real. The pattern is proven. Phase 4B-fan-out replicates the work for GitHub, Newsletter, YouTube, Podcast (the four "easy" providers — each ~1 day). Then LinkedIn manual import (2-3 days). Then Instagram OAuth (3-5 days). Then attribution (Phase 4C) once Stripe/Substack data is integrated. Then Bobbito (Phase 4D, 2-3 hours).

The plan reference is `users-keeganmoody-downloads-every-extra-keen-whale.md` §12.2 and §12.7.

---

*End of prompt. Ship clean.*
