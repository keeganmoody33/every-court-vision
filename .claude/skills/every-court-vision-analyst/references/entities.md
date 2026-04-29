_Last updated: 2026-04-29_

# Entities

Every model below is defined in `prisma/schema.prisma`. The Prisma client (`db`, exported from `lib/db.ts`) generates a typed accessor per model — `db.employee`, `db.post`, etc. Reads from `lib/queries.ts` map the raw DB rows into the TypeScript domain types in `lib/types.ts` (e.g. `Platform` enum `LINKEDIN` becomes union member `"LinkedIn"` via the `platformFromDb` table at `lib/queries.ts:39-58`).

The 14 entities below are the ones a typical question lands on. The repo also defines `Report` (`schema.prisma:319-329`) and `DataSource` (`:331-340`); `DataSource` is read by `getDataSources()` for `/attribution`, see `queries.md`.

---

## Company

`prisma/schema.prisma:72-82` — top-level container. One row in production: Every itself.

```ts
model Company {
  id        String     @id @default(cuid())
  name      String
  domain    String
  website   String
  employees Employee[]
  surfaces  Surface[]
  reports   Report[]
}
```

Relationships: `Employee[]`, `Surface[]`, `Report[]`. Most queries scope through `Employee` rather than touching `Company` directly.

---

## Employee

`prisma/schema.prisma:84-112` — a person on Every's team.

Key fields:

```
id, name, role, archetype
primarySurface  Platform   // see platforms.md
secondarySurface Platform
signatureMove, opportunity, bestShot, bestAssist
surfacePresence Float @default(0)
surfaceIQ       Float @default(0)
trustGravity    Float @default(0)
socialTS        Float @default(0)
shotDistribution Json @default("{}")
recommendedPlayId String?
dataReadiness    DataReadiness @default(PUBLIC_ONLY)
```

The four cached metric fields (`surfacePresence`, `surfaceIQ`, `trustGravity`, `socialTS`) are **denormalized snapshots** populated by seed/fixtures. Not all of them have a compute function in `lib/scoring.ts` — see `metrics.md` for which is computed where.

Relationships: `accounts` (`SocialAccount[]`), `surfaces` (`Surface[]`), `metrics` (`Metric[]`), `posts` (`Post[]`), `rippleEvents` (`RippleEvent[]`), `experiments` (`Experiment[]`).

Standard read: `getRoster()` (`lib/queries.ts:304-315`) — includes `accounts`, `surfaces`, and a `_count: { posts: true }`. `getEmployee(id)` (`lib/queries.ts:317-364`) adds `metrics`.

---

## SocialAccount

`prisma/schema.prisma:114-124` — thin mirror of an `Employee`'s handles per platform. Used only by `/players` for the follower-count footer (`app/players/page.tsx:35-46`). Distinct from `Surface` and not the canonical join point.

```ts
model SocialAccount {
  id         String
  employeeId String
  platform   Platform
  handle     String
  followers  Int
  confidence MetricConfidence
}
```

---

## Surface

`prisma/schema.prisma:126-152` — a public profile owned by an Employee (or by Company if `employeeId` is null) on a Platform. **The canonical join point for everything related to a public footprint.**

```
id, companyId, employeeId?, platform, handle, url?
present     Boolean @default(true)
status      String  @default("VERIFIED")
followers   Int     @default(0)
confidence  MetricConfidence @default(ESTIMATED)
lastScrapedAt    DateTime?
attributionValue String?
opportunity      String?

@@unique([employeeId, platform])   // added 2026-04-29
@@index([companyId, platform])
@@index([employeeId, platform])
```

Relationships: `posts` (`Post[]`), `metrics` (`Metric[]`), `acquisitionJobs` (`AcquisitionJob[]`), `rawActivities` (`RawActivity[]`).

Standard read: `getAcquisitionRows()` (`lib/queries.ts:489-556`) — includes `employee`, `posts: { select: { id: true } }`, `rawActivities`, last `acquisitionJob`.

---

## Post

`prisma/schema.prisma:154-197` — a single piece of content. Court coordinates `x`, `y`, `zone`, and `advancedZone` are what shot-plot renders.

```
id, employeeId, surfaceId?, text
platform     Platform
contentType  String   // see ContentType union in lib/types.ts:41-53
archetype, campaign, ctaType, brandTouch, product
launchWindow Boolean  @default(false)
publishedAt  DateTime
x            Float    @default(50)
y            Float    @default(47)
zone         String   // basicZones — see lib/constants.ts:97-107
advancedZone String   // advancedZones — see lib/constants.ts:109-122
confidence   MetricConfidence
externalId, permalink, rawActivityId, sourceId
acquiredVia  AcquisitionProvider?
acquiredAt   DateTime?
```

`Post.surfaceId` is **nullable** — guard before chaining `.surface`.

Relationships: `metrics` (`PostMetrics?`), `scores` (`PostScores?`), `rippleEvents` (`RippleEvent[]`), `recommendedPlay` (`Play?`), `rawActivity` (`RawActivity?`).

Indexes: by `(platform, publishedAt)`, `(employeeId, publishedAt)`, `(surfaceId, publishedAt)`, `(rawActivityId)`, `(surfaceId, externalId)`, `(sourceId)`, `(campaign)`.

Standard read: `getPosts(filters)` (`lib/queries.ts:366-383`) — includes `metrics`, `scores`, `employee`. Then mapped via `mapPost` and run through `filterPosts(posts, filters)` from `lib/aggregations.ts:23-29`.

---

## PostMetrics

`prisma/schema.prisma:199-218` — engagement and conversion counts, 1:1 with `Post`. The 15 numerator fields drive every aggregation in `lib/aggregations.ts`.

```
postId String @unique
views, reach, likes, comments, replies, reposts, quotes, shares
clicks, profileVisits, signups, paidSubscriptions, consultingLeads
revenue, assistedConversions    // all Int
```

If a Post has no `metrics` row, `mapPost` substitutes a frozen `emptyMetrics` (`lib/queries.ts:77-93`) so downstream code does not crash.

---

## PostScores

`prisma/schema.prisma:220-238` — pre-computed 0-100 scores per post, 1:1 with `Post`.

```
postId String @unique
awareness, engagement, trust, clicks, signups, paid, consulting, revenue, assists
surfaceIQ, socialTS, assistRate, trustGravity, humanHalo    // all Float
```

`scoreForMode(post, mode)` (`lib/scoring.ts:11-32`) reads this row for `Awareness`, `Engagement`, `Trust`, `Clicks` modes; for `Signups`, `Paid Subs`, `Consulting Leads`, `Revenue`, `Assists` it reads from `PostMetrics` instead. **Important asymmetry** — see `metrics.md`.

---

## RippleEvent

`prisma/schema.prisma:240-253` — downstream attributed effect rooted at a single post.

```
id, rootPostId, parentId?, employeeId?
actor      String
platform   Platform
eventType  String
occurredAt DateTime
value      Int
confidence MetricConfidence
```

A `RippleEvent` may itself spawn child events via `parentId` — the `RippleGraph` component on `/stream` walks the tree.

Standard reads:
- `getAllRippleEvents()` (`lib/queries.ts:392-395`) — unscoped, indexed
- `scopeRippleEventsToPosts(events, posts)` (`lib/queries.ts:401-407`) — pure in-memory filter
- `getRippleEvents(filters, prefetchedPosts?)` (`lib/queries.ts:421-430`) — convenience pair

The split exists so the ripple query can run **in parallel** with the post query rather than serializing behind it. Prefer the lower-level pair when you also need the filtered post set.

---

## Play

`prisma/schema.prisma:292-303` — a named motion (e.g. "Soft CTA After Trust Post", "LinkedIn Consulting Wedge"). Posts can `recommendedPlayId` into this table to suggest the next experiment.

```
id   String   @id            // not @default(cuid()) — IDs are slugs
name, bestFor
bestPlatforms Platform[]
structure, whyItWorks, historicalSignal, recommendedNextExperiment
```

Standard read: `getPlays()` (`lib/queries.ts:432-444`).

---

## Experiment

`prisma/schema.prisma:305-317` — an in-flight test of a Play.

```
playId, ownerEmployeeId
name, hypothesis, status, metric
```

`status` is a free-string but rendered with values like `"Planned"`, `"Running"`, `"Complete"` (`lib/types.ts:225`). `metric` is a `ScoringMode` (`lib/types.ts:30-39`).

Standard read: `getExperiments()` (`lib/queries.ts:446-457`).

---

## Metric

`prisma/schema.prisma:255-290` — windowed aggregate per `(employeeId, surfaceId, platform, timeWindow, windowStart)`. This is the rollup table; individual `PostMetrics` are the leaves.

Carries the same 15 raw counters as `PostMetrics` plus the four computed scores (`surfaceIQ`, `socialTS`, `assistRate`, `trustGravity`). Read by `getEmployee(id)` (`lib/queries.ts:317-364`) — the per-platform `SplitRow` array on the player profile.

Indexed `(employeeId, timeWindow, windowStart)` and `(surfaceId, timeWindow, windowStart)`.

---

## AcquisitionJob

`prisma/schema.prisma:358-381` — one ingestion run against one Surface by one Provider.

```
surfaceId, provider, status (AcquisitionJobStatus)
windowStart, windowEnd
attempts, rawCount, inserted, updated, skipped     // Int counters
failureCode?, failureReason?
startedAt?, completedAt?
```

Indexes: `(surfaceId, createdAt)`, `(provider, status)`. Statuses are `QUEUED | RUNNING | SUCCEEDED | PARTIAL | FAILED | DISABLED` (`schema.prisma:63-70`).

Read inside `getAcquisitionRows()` to surface the most recent job per Surface on `/acquisition`.

---

## AcquisitionRoute

`prisma/schema.prisma:342-356` — the canonical fallback ladder: per-platform, per-provider, ordered.

```
platform, provider (AcquisitionProvider), routeOrder Int
capability, requiredEnv?
confidence    MetricConfidence
complianceNote String

@@unique([platform, provider, routeOrder])
@@index([platform, routeOrder])
```

`AcquisitionProvider` enum (`schema.prisma:51-61`): `X_API | LINKEDIN_API | GITHUB_API | YOUTUBE_API | RSS | SPIDER | PARALLEL | MANUAL | INSTAGRAM_GRAPH`.

Read inside `getAcquisitionRows()` and grouped by platform; `policiesForPlatform()` from `lib/acquisition/policies` provides a fallback if a platform has no rows yet (`lib/queries.ts:507-520`).

---

## RawActivity

`prisma/schema.prisma:383-406` — the unprocessed acquisition record.

```
surfaceId, jobId?, provider (AcquisitionProvider)
externalId, permalink?, publishedAt
text
rawMetrics  Json @default("{}")
rawPayload  Json @default("{}")
citations   Json @default("[]")
basis       Json?
confidence  MetricConfidence @default(ESTIMATED)

@@unique([surfaceId, externalId])    // idempotency key
@@index([surfaceId, publishedAt])
@@index([provider, publishedAt])
```

Posts derive from RawActivities via `Post.rawActivityId` (`schema.prisma:177`). The `(surfaceId, externalId)` unique constraint is what makes ingestion safely re-runnable.

---

## Confidence enum (cross-cutting)

`MetricConfidence` (`schema.prisma:30-36`): `DIRECT | ESTIMATED | MODELED | HYPOTHESIS | NEEDS_INTERNAL_ANALYTICS`. Stored on Surface, Post, RawActivity, RippleEvent, AcquisitionRoute, SocialAccount, Metric. The TS-side mapping (`lib/queries.ts:60-66`) renders these as `"Direct"`, `"Estimated"`, `"Modeled"`, `"Hypothesis"`, `"Needs Internal Analytics"`.
