_Last updated: 2026-04-29_

# Filters and data hygiene

Standard `where:` clauses for filtering test/internal/low-confidence rows, and the time-window conventions across the corpus. **All Prisma idiom — no SQL.**

The DB enums (`MetricConfidence`, `Platform`, `AcquisitionProvider`, etc.) are written `UPPER_SNAKE`. The TS string-union types (`lib/types.ts`) re-spell them with display casing. When you write a `where:` clause against `db.<model>`, use the **DB enum form** — the mapping happens later in `lib/queries.ts`.

---

## Confidence filters

The pedigree enum is `MetricConfidence` (`prisma/schema.prisma:30-36`):

```
DIRECT | ESTIMATED | MODELED | HYPOTHESIS | NEEDS_INTERNAL_ANALYTICS
```

### Posts: real measurements only

```ts
const realPosts = await db.post.findMany({
  where: {
    confidence: { not: "NEEDS_INTERNAL_ANALYTICS" },
  },
});
```

### Posts: scraped (not seeded)

`Post.acquiredVia` is `null` for fixtures, set to an `AcquisitionProvider` enum value for real scrapes (`schema.prisma:179`).

```ts
const scrapedPosts = await db.post.findMany({
  where: { acquiredVia: { not: null } },
});
```

### Posts: provenance via sourceId

`Post.sourceId` is the runtime provenance tag (`lib/types.ts:184-189`). `null` or `seed:*` = preview/fixture; `acquired:<provider>` = real.

```ts
const productionOnly = await db.post.findMany({
  where: {
    sourceId: { not: null, not: { startsWith: "seed:" } },
  },
});
```

### Surfaces: live and verified

`Surface.present` defaults to `true`, `Surface.status` defaults to `"VERIFIED"` (`schema.prisma:135-136`). Filter explicitly when you want to exclude provisional or hidden rows.

```ts
const liveSurfaces = await db.surface.findMany({
  where: { present: true, status: "VERIFIED" },
});
```

### Surfaces: trustworthy follower counts

```ts
const verifiedFollowers = await db.surface.findMany({
  where: {
    confidence: { in: ["DIRECT", "ESTIMATED"] },
  },
});
```

### RippleEvents: high-confidence only

```ts
const trustedRipples = await db.rippleEvent.findMany({
  where: { confidence: { in: ["DIRECT", "ESTIMATED"] } },
});
```

---

## Platform filters

Use the **DB enum form** (`X`, `LINKEDIN`, `GITHUB`, `INSTAGRAM`, `NEWSLETTER`, `YOUTUBE`, `PODCAST`, `LAUNCHES`, `TEAMMATE_AMPLIFICATION`, `EXTERNAL_AMPLIFICATION`, `PRODUCT_HUNT`, `PERSONAL_SITE`, `TIKTOK`, `WEBSITE`, `SUBSTACK`, `APP_STORE`, `REFERRAL`, `CONSULTING`).

### Single platform

```ts
const xPosts = await db.post.findMany({
  where: { platform: "X" },
});
```

### Core 7 only (the `coreSurfaces` set)

```ts
const corePosts = await db.post.findMany({
  where: {
    platform: {
      in: ["X", "LINKEDIN", "GITHUB", "INSTAGRAM", "NEWSLETTER", "YOUTUBE", "PODCAST"],
    },
  },
});
```

### Phase 5a discovery target (8)

```ts
const phase5aPosts = await db.post.findMany({
  where: {
    platform: {
      in: ["X", "LINKEDIN", "GITHUB", "SUBSTACK", "INSTAGRAM", "NEWSLETTER", "YOUTUBE", "PODCAST"],
    },
  },
});
```

---

## Time-window conventions

All `DateTime` columns in the DB are **UTC**. Demo seed dates cluster in **2026-04**. If a chart looks empty, check that the time window includes that month.

The default time-window filter is `90D` (`lib/constants.ts:55`). The `TimeWindow` union (`lib/types.ts:55`) is `"7D" | "30D" | "90D" | "Launch Window" | "Custom"`.

### 90-day window

```ts
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const recentPosts = await db.post.findMany({
  where: { publishedAt: { gte: ninetyDaysAgo } },
});
```

### Launch window

`Post.launchWindow Boolean @default(false)` (`schema.prisma:168`). `filterPosts(posts, filters)` (`lib/aggregations.ts:23-29`) handles this in JS, but you can short-circuit at the DB layer:

```ts
const launchPosts = await db.post.findMany({
  where: { launchWindow: true },
});
```

### Custom range

```ts
const ranged = await db.post.findMany({
  where: { publishedAt: { gte: start, lte: end } },
});
```

### Windowed `Metric` rows

`Metric.timeWindow` is a string (`"7D" | "30D" | "90D" | "Launch Window" | "Custom"`), and `windowStart` + optional `windowEnd` bound it. Use the indexed `(employeeId, timeWindow, windowStart)` for the typical lookup:

```ts
const ninetyDay = await db.metric.findMany({
  where: {
    employeeId,
    timeWindow: "90D",
    windowStart: { gte: someDate },
  },
});
```

---

## Employee filters

`Employee.dataReadiness` (`schema.prisma:91`) is `PUBLIC_ONLY | MANUAL_IMPORT | LIVE`.

### Live data only

```ts
const live = await db.employee.findMany({
  where: { dataReadiness: "LIVE" },
});
```

### Has analytics posts

```ts
const withPosts = await db.employee.findMany({
  where: { posts: { some: {} } },
});
```

`getRoster()` does **not** filter on either of these — it returns every Employee. Apply downstream if needed.

---

## Surface filters

### Surfaces with successful jobs

```ts
const recentlyAcquired = await db.surface.findMany({
  where: {
    acquisitionJobs: {
      some: { status: "SUCCEEDED", completedAt: { gte: ninetyDaysAgo } },
    },
  },
});
```

### Surfaces missing data

```ts
const stale = await db.surface.findMany({
  where: {
    OR: [
      { lastScrapedAt: null },
      { lastScrapedAt: { lt: ninetyDaysAgo } },
    ],
  },
});
```

### Per-employee primary surface only

```ts
const employeesWithPrimary = await db.employee.findMany({
  include: {
    surfaces: {
      where: { platform: { in: ["X", "LINKEDIN", "NEWSLETTER"] } },
    },
  },
});
```

(Strictly, `Employee.primarySurface` is the canonical pointer — but it stores a `Platform` enum value, not a `Surface.id`. Use it to look up the matching Surface row.)

---

## RawActivity and AcquisitionJob filters

### Failed jobs

```ts
const failures = await db.acquisitionJob.findMany({
  where: { status: "FAILED" },
  orderBy: { createdAt: "desc" },
});
```

### Most recent raw activity per surface

```ts
const surfaceWithLatest = await db.surface.findUnique({
  where: { id: surfaceId },
  include: {
    rawActivities: { orderBy: { publishedAt: "desc" }, take: 1 },
  },
});
```

### RawActivity that has a Post derivative

```ts
const promoted = await db.rawActivity.findMany({
  where: { posts: { some: {} } },
});
```

---

## Combined "production-quality" pattern

When a chart needs to mean what it shows:

```ts
const productionPosts = await db.post.findMany({
  where: {
    confidence: { not: "NEEDS_INTERNAL_ANALYTICS" },
    sourceId: { not: { startsWith: "seed:" } },
    publishedAt: { gte: ninetyDaysAgo },
    surface: {
      present: true,
      status: "VERIFIED",
    },
  },
  include: { metrics: true, scores: true },
  orderBy: { publishedAt: "desc" },
});
```

Adapt as needed. For demo views the seeded data is intentional and you should keep it.
