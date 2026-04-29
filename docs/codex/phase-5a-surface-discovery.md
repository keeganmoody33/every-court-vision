# Phase 5a — Per-Employee Surface Discovery Pipeline

_Codex prompt drafted 2026-04-29. Pre-req: Phase 0 schema fix `Surface @@unique([employeeId, platform])` is shipped on `main` (see [`prisma/schema.prisma`](../../prisma/schema.prisma))._

## Mission

For every `Employee` in the database, populate `Surface` rows across the **8 active discovery platforms**, plus `PodcastAppearance` rows for guest spots on shows owned by other people. Use Parallel as the primary search, Spider as opt-in deep-dive, and native web search as fallback. Re-runnable. Idempotent. Bearer-auth-gated.

Writing surfaces this way unblocks the existing acquisition router ([`lib/acquisition/router.ts`](../../lib/acquisition/router.ts)) — once `Surface` rows exist, the router has something to iterate over for ingestion. Right now it has nothing to iterate over for surfaces that aren't in the seed fixture.

## Active discovery platforms (8)

- **X** (Twitter)
- **LinkedIn**
- **GitHub**
- **Substack**
- **Instagram**
- **Newsletter** (non-Substack: beehiiv, ConvertKit, Ghost, custom domain)
- **YouTube**
- **Podcast** (guest appearances — see `PodcastAppearance` model below)

`PERSONAL_SITE`, `WEBSITE`, `TIKTOK`, `LAUNCHES`, `PRODUCT_HUNT`, `APP_STORE`, `REFERRAL`, `CONSULTING`, `TEAMMATE_AMPLIFICATION`, `EXTERNAL_AMPLIFICATION` stay placeholder until later phases.

## Schema changes

**Pre-req (already shipped in Phase 0):** see [`prisma/schema.prisma`](../../prisma/schema.prisma) — the `Surface` model now has `@@unique([employeeId, platform])` so `upsert` is well-defined.

**New model in this phase:**

```prisma
model PodcastAppearance {
  id           String           @id @default(cuid())
  employeeId   String
  employee     Employee         @relation(fields: [employeeId], references: [id])
  showName     String
  episodeUrl   String
  episodeDate  DateTime?
  episodeTitle String?
  source       String           // "parallel" | "spider" | "manual"
  confidence   MetricConfidence @default(ESTIMATED)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([employeeId, episodeUrl])
  @@index([employeeId, episodeDate])
}
```

Add to `Employee`:
```prisma
podcastAppearances PodcastAppearance[]
```

Apply with `pnpm db:push`.

## Provider refactor (pre-req for the discovery module)

[`lib/acquisition/providers/parallel.ts`](../../lib/acquisition/providers/parallel.ts) and [`spider.ts`](../../lib/acquisition/providers/spider.ts) currently each return a single opaque `RawActivityInput` whose `text` field is JSON-stringified raw payload (first 4000 chars). Discovery needs structured URLs and confidence, not opaque text.

Refactor both to expose **structured** methods alongside the existing `collect(context)` adapter:

```ts
// lib/acquisition/providers/parallel.ts
export async function searchStructured(query: string): Promise<{
  urls: string[];
  confidence: number;
  raw: unknown;
}>;
```

```ts
// lib/acquisition/providers/spider.ts
export async function crawlStructured(url: string): Promise<{
  exists: boolean;        // HEAD-like: true if upstream returns 200 or 302
  html: string;           // empty string if !exists
  mentions: string[];     // any name fragments found in the body
}>;
```

The existing `collect(context)` adapter keeps working — wrap it around the new structured functions. The `ProviderAdapter` interface continues to satisfy the acquisition router. No breaking change to existing acquisition flows.

## Discovery module: `lib/discovery/perEmployee.ts` (new)

```ts
import type { Platform } from "@prisma/client";

export type DiscoveryResult = {
  employeeId: string;
  surfacesUpserted: number;
  podcastsUpserted: number;
  manualFlags: Array<{ platform: Platform | "PODCAST"; reason: string }>;
};

export async function discoverSurfacesFor(
  employeeId: string,
  options?: { deep?: boolean }
): Promise<DiscoveryResult>;
```

**Per-platform sequence (default verification = Parallel + HEAD):**

```
parallel.searchStructured(query) -> { urls[], confidence }
   ↓ if empty or confidence < 0.7
spider.crawlStructured(predictedUrl) -> { exists, html, mentions }
   ↓ if also !exists
manual_flag (push to result.manualFlags, do NOT upsert)
```

**Optional `--deep` flag adds:**

```
spider.crawlStructured(url) -> { mentions }
   ↓ if mentions does NOT include the employee's name
downgrade Surface.confidence from VERIFIED to ESTIMATED
```

**Platform-specific shortcuts:**

- **GitHub:** if the employee has an X handle in their existing surfaces, try `https://github.com/{x_handle}` first (devs often share). Fall back to Parallel if 404.
- **Substack:** try `https://{x_handle}.substack.com` and `https://{slug-from-name}.substack.com` before Parallel.
- **Instagram:** HEAD often returns `302` redirects (login wall). Treat both `200` and `302` as present.
- **LinkedIn:** Spider is **explicitly blocked** on LinkedIn surfaces (D12 compliance — see existing implementation in [`lib/acquisition/providers/spider.ts`](../../lib/acquisition/providers/spider.ts)). Use Parallel + HEAD only. Do not attempt to scrape post content.

## Script: `scripts/discover-all.ts` (new)

```ts
// Usage:
//   pnpm discover:all                       — full roster, default verification
//   pnpm discover:all --deep                — add Spider mention check
//   pnpm discover:all --employee=austin-tedesco  — single-employee dry run
//
// Walks prisma.employee.findMany() and runs discoverSurfacesFor(id, { deep }) for each.
// Idempotent via @@unique constraints on Surface and PodcastAppearance.
// Rate limit: max 1 Parallel call per (employee, platform) per minute.
```

Add to `package.json` `scripts`:

```json
"discover:all": "tsx scripts/discover-all.ts"
```

## API route: `app/api/discover/[employeeId]/route.ts` (new)

This introduces the **canonical Bearer auth pattern** for sensitive ingest routes. The existing [`app/api/import/activity/route.ts`](../../app/api/import/activity/route.ts) has no auth check — a follow-up PR should retrofit it to match this pattern.

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoverSurfacesFor } from "@/lib/discovery/perEmployee";

export async function POST(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  const auth = req.headers.get("authorization");
  const expected = process.env.DISCOVERY_API_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const employee = await db.employee.findUnique({
    where: { id: params.employeeId },
  });
  if (!employee) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { deep?: boolean };
  const result = await discoverSurfacesFor(params.employeeId, { deep: body.deep });
  return NextResponse.json(result);
}
```

Set `DISCOVERY_API_TOKEN` as a required env var (`.env.example` and Vercel project env). Treat missing token as `401` rather than `500` so probes don't get a stack trace.

## Reuses

- **`Platform` enum** (8 active values: `X`, `LINKEDIN`, `GITHUB`, `SUBSTACK`, `INSTAGRAM`, `NEWSLETTER`, `YOUTUBE`, `PODCAST`). Defined in [`prisma/schema.prisma`](../../prisma/schema.prisma) (Platform enum block).
- **`MetricConfidence` enum** (`VERIFIED` | `ESTIMATED` | `MODELED` | `HYPOTHESIS` | `UNAVAILABLE`). Used for both `Surface.confidence` and `PodcastAppearance.confidence`.
- **Prisma `upsert`** keyed on the new `@@unique([employeeId, platform])` for `Surface` and `@@unique([employeeId, episodeUrl])` for `PodcastAppearance`.
- **`db` client** from [`lib/db.ts`](../../lib/db.ts).

**Do NOT reuse [`lib/acquisition/persist.ts`](../../lib/acquisition/persist.ts)** — that module writes `Post` + `RawActivity` + `PostMetrics` + `PostScores`. Discovery is a separate write path: it writes `Surface` and `PodcastAppearance` only. Keep them decoupled.

## Acceptance criteria

Run against the post-Phase-3 Neon DB (24+ employees):

- **`pnpm discover:all`** produces:
  - **≥ 80 `Surface` rows** total. Math: 16 baseline employees with ~5 self-owned platforms confirmed each + 8 new with ~5 each = ~120, but expect some absences (not every writer has GitHub, not every operator has Substack) — floor at 80.
  - **≥ 30 `PodcastAppearance` rows** across the roster.
- **Re-running is idempotent** — `Surface` and `PodcastAppearance` counts do not increase on a clean re-run. Test with: count → discover:all → count → discover:all → count. Counts on runs 2 and 3 must equal run 1.
- **`/api/discover/[employeeId]`** returns:
  - `401` without `Authorization: Bearer <token>` header
  - `200` with valid token + valid employeeId
  - `404` with valid token but non-existent employeeId
- **`pnpm typecheck` and `pnpm lint` pass.**

## Out of scope for Phase 5a (deferred)

- **Backfill of `Post` rows** from newly-discovered Surfaces. The existing acquisition router handles ingest once Surface rows exist; Phase 5a stops at "Surface rows exist." Backfill is Phase 5b.
- **LinkedIn content scraping.** D12 compliance: store handles only, not post content.
- **TikTok or Personal Site discovery.** Enum values exist but not in active scope.
- **Retrofit `/api/import/activity` to use Bearer auth.** Worth doing but separate PR.
- **Web search for podcast appearances >12 months old.** Cap Parallel queries to "last 12 months" for podcasts.

## Verification path

1. `pnpm db:push` — apply `PodcastAppearance` model + `Employee.podcastAppearances` relation
2. `pnpm typecheck && pnpm lint`
3. Set `DISCOVERY_API_TOKEN=<random-token>` in `.env`
4. `pnpm discover:all --employee=austin-tedesco` (single-employee dry run)
5. Inspect via `pnpm db:studio`:
   - Austin's `Surface` rows now include X, LinkedIn, GitHub, Substack (or whichever he has)
   - `confidence` is `VERIFIED` for HEAD-confirmed; `ESTIMATED` otherwise
6. `pnpm discover:all` (full run)
7. Verify totals: `SELECT COUNT(*) FROM "Surface"` ≥ 80, `SELECT COUNT(*) FROM "PodcastAppearance"` ≥ 30
8. `pnpm discover:all` again — counts must NOT increase (idempotency)
9. Curl tests:

```bash
# 401 without token
curl -X POST http://localhost:3000/api/discover/austin-tedesco
# 200 with token
curl -X POST -H "Authorization: Bearer $DISCOVERY_API_TOKEN" \
  http://localhost:3000/api/discover/austin-tedesco
# 404 with token but bad id
curl -X POST -H "Authorization: Bearer $DISCOVERY_API_TOKEN" \
  http://localhost:3000/api/discover/nonexistent-id
```

## Open questions for the implementing agent

- **Parallel pricing.** Expect ~8 platform queries per employee × 24 employees = ~200 Parallel calls per full run. Confirm budget allows this monthly. If not, gate the script with a `--budget=N` cap.
- **Concurrency.** Should `discover-all` run employees in parallel (e.g., 4 at a time) or strictly sequential? Sequential is safer for rate limits but slower. Default to sequential.
- **Manual-flag handling.** When `manualFlags` is non-empty, where does the user see them? Suggested: write to a new `DiscoveryAuditLog` table or just stdout for now. Phase 5a default: stdout, surface in script output.

## Closing note for the implementing agent

The architecture is settled — bottleneck is enumerated surfaces. Without a `Surface` row for Austin's GitHub or Naveen's Substack, the backfill script has nothing to iterate. This phase fixes that, idempotently and verifiably, with one new model and one new auth pattern. Ship the surfaces; let downstream backfill (Phase 5b) do its job.
