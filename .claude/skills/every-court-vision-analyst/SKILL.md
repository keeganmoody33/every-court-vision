---
name: every-court-vision-analyst
description: Use when answering questions about Every Court Vision's data model, metrics (Surface IQ, Trust Gravity, Social TS%), surface acquisition pipeline, ripple-event attribution, or app routes. Pulls from the Prisma schema and lib/scoring + lib/queries + lib/aggregations.
---

_Last updated: 2026-04-29_

# Every Court Vision Analyst

A data-context skill for an analyst or agent reading or writing against Every Court Vision. The repo is a Next.js + Prisma app. **All queries are Prisma + TypeScript** — there is no SQL warehouse, no BigQuery/Snowflake/Postgres dialect to learn. If you find yourself reaching for `SELECT * FROM`, stop and use `db.<model>.findMany({ where: ... })` instead.

## Quick orientation

The product mission, lifted verbatim from `TODO.md:14-21`:

> Every Court Vision is a basketball analytics translation layer for growth, not a social media dashboard.
>
> The product frames Every's distributed off-platform growth like an NBA film room:
> posts are shots, clicks are attempts, signups are makes, paid subscriptions are threes, consulting leads are and-ones, teammate amplification is assists, and trust-building content creates gravity.
>
> The rule to preserve across product, copy, data, and demos:
>
> > This does not tell people to post more. It helps people understand what kind of growth they already create.

Every analytical question on the app traces back to that translation. Surface IQ ranks the surfaces a person already wins on. Trust Gravity flags the posts that cleared a deeper-than-engagement bar. Social TS% trades off shot quality against shot volume. Read the metric like a coach reading tape — not like a leaderboard.

## Translation table (basketball ↔ growth)

| Basketball | Growth |
|---|---|
| Shot | Post |
| Attempt | Click |
| Make | Signup |
| Three-pointer | Paid subscription |
| And-one | Consulting lead |
| Assist | Teammate amplification |
| Gravity | Trust-building content |
| Possessions | Reach |

## Entity disambiguation (the four core entities)

Most questions resolve to one of these four. Get the chain right:

- **`Employee`** (`prisma/schema.prisma:84-112`) — a person on Every's team. Stores cached metric snapshots (`surfacePresence`, `surfaceIQ`, `trustGravity`, `socialTS`) and the `primarySurface` / `secondarySurface` Platform pointers used by `/players`. ~16 rows seeded; not all have analytics posts.
- **`Surface`** (`prisma/schema.prisma:126-152`) — a public profile owned by an Employee on a Platform. As of 2026-04-29 there is a `@@unique([employeeId, platform])` constraint (`schema.prisma:149`); older snapshots may have duplicates. `Surface` is the canonical join point — distinct from `SocialAccount` which is a thinner mirror used only by `/players` for follower counts.
- **`Post`** (`prisma/schema.prisma:154-197`) — a single piece of content tied to one Employee and (optionally) one Surface. Carries court coordinates `x`, `y`, `zone`, `advancedZone` — these drive shot-plot rendering. `Post.surfaceId` is **nullable**; not every post has a Surface link.
- **`RawActivity`** (`prisma/schema.prisma:383-406`) — the unprocessed acquisition record (one row per `(surfaceId, externalId)`). `Post` is the curated, court-coordinate-mapped derivative; `RawActivity` is what the providers wrote down. Connected via `Post.rawActivityId`.

Downstream attribution lives in **`RippleEvent`** (`schema.prisma:240-253`) — a tree of attributed effects (signup, paid conversion, consulting lead, teammate amplification) rooted at `rootPostId`. See `references/entities.md` for the full set.

## Standard filters and data hygiene

Default exclusions for production-quality reads:

- **Posts**: filter `confidence != "NEEDS_INTERNAL_ANALYTICS"` for charts that imply real values; `acquiredVia != null` distinguishes scraped posts from seeded mocks. The `sourceId` field carries provenance — `null` or `seed:*` means fixture, `acquired:<provider>` means real (`lib/types.ts:184-189`).
- **Surfaces**: `present: true` and `status: "VERIFIED"` for live surfaces. The defaults are `true`/`"VERIFIED"` (`schema.prisma:135-136`), but discovery flows can write provisional rows.
- **Time**: all `publishedAt` / `occurredAt` / `windowStart` are stored UTC. Demo seed dates cluster in **2026-04** — if a chart is empty, check that the time window includes that month.
- **Time-window default**: `90D` (`lib/constants.ts:55`).

See `references/filters.md` for the exact `where:` clauses.

## Common gotchas

- **Surface uniqueness was added 2026-04-29** (`schema.prisma:149`). Older DB snapshots may contain duplicate `(employeeId, platform)` rows; new discovery runs will be idempotent against the constraint.
- **`Post.surfaceId` is nullable** (`schema.prisma:158`). Do not assume `post.surface` exists; guard before reading it.
- **`Platform` enum has 18 values** (`schema.prisma:9-28`). Only **7** are in the `coreSurfaces` set rendered by `platformCards()` (`lib/constants.ts:26-34`). The Phase 5a discovery spec **targets** 8 platforms (the 7 core + `SUBSTACK`); discovery itself is out of scope for the current ship.
- **`lib/scoring.ts` is the source of truth for *computed* metric math.** Surface IQ and Surface Presence are **stored fields** populated upstream (seed/fixtures), not derived in `lib/scoring.ts` — no compute function exists for them as of 2026-04-29.
- **The DB enum and the TS string union differ.** `prisma/schema.prisma` uses `LINKEDIN`, `GITHUB`; `lib/types.ts:1-19` uses `"LinkedIn"`, `"GitHub"`. The mapping table is `platformFromDb` in `lib/queries.ts:39-58`.
- **`scoreForMode` does not return `Post.scores.assists`.** For the `"Assists"` mode, it returns `metrics.assistedConversions` (the count) — `lib/scoring.ts:11-32`. Don't confuse the score (0-100) with the count (raw integer).

## Knowledge base navigation

- [`references/entities.md`](references/entities.md) — every Prisma model the app reads, with line numbers and relationships
- [`references/metrics.md`](references/metrics.md) — Surface IQ, Trust Gravity, Social TS%, Assist Rate, Plus-Minus, make/miss/assist classification
- [`references/platforms.md`](references/platforms.md) — the 18-value Platform enum, per-platform handle conventions, the 7-core / 8-Phase-5a-target distinction
- [`references/queries.md`](references/queries.md) — common Prisma read patterns from `lib/queries.ts` and aggregation patterns from `lib/aggregations.ts`
- [`references/routes.md`](references/routes.md) — the 11 app routes mapped to their queries and scoring modes
- [`references/filters.md`](references/filters.md) — standard `where:` clauses, time-window conventions, hygiene defaults
