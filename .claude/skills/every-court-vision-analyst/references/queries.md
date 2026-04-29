_Last updated: 2026-04-29_

# Queries

The exported reads live in `lib/queries.ts` (server-only) and the in-memory aggregations live in `lib/aggregations.ts`. **Routes call queries; queries return mapped TS types; aggregations crunch the result set into rolled-up shapes for charts and tables.**

Every page that calls `lib/queries.ts` declares `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`. Don't import these into Edge runtime routes.

---

## Read patterns from `lib/queries.ts`

### `getRoster()` — `lib/queries.ts:304-315`

Every employee with their accounts, surfaces, and post count. Ordered `socialTS desc, name asc`. Returns `EmployeeWithSurfaces[]`.

```ts
const employees = await db.employee.findMany({
  include: {
    accounts: true,
    surfaces: true,
    _count: { select: { posts: true } },
  },
  orderBy: [{ socialTS: "desc" }, { name: "asc" }],
});
```

Used by: `/players`, `/overview`, `/shot-plot`, `/splits`, `/plays`. Cheapest "give me the people" query.

### `getEmployee(id)` — `lib/queries.ts:317-364`

Single employee plus the rolled-up `Metric[]` per platform (renders as `SplitRow[]`). Includes `accounts`, `surfaces`, `metrics`, post count.

Used by: `PlayerProfile` deep views (currently rendered as part of `/players`). Returns `EmployeeWithSurfacesAndMetrics | null`.

### `getPosts(filters)` — `lib/queries.ts:366-383`

Every post with `metrics`, `scores`, and `employee` (which itself includes accounts/surfaces). Ordered `publishedAt desc`. The result is then run through `filterPosts(posts, filters)` from `lib/aggregations.ts:23-29` before being returned, so the `surface` filter and `Launch Window` time bucket are applied client-side in JS.

```ts
const posts = await db.post.findMany({
  include: {
    metrics: true,
    scores: true,
    employee: {
      include: { accounts: true, surfaces: true, _count: { select: { posts: true } } },
    },
  },
  orderBy: { publishedAt: "desc" },
});
```

Used by: every route that renders the corpus (`/overview`, `/shot-plot`, `/court-heat`, `/splits`, `/shot-zones`).

### `getAllRippleEvents()` — `lib/queries.ts:392-395`

Every ripple event, unscoped, ordered `occurredAt asc`. Cheap and indexed.

### `scopeRippleEventsToPosts(events, posts)` — `lib/queries.ts:401-407`

Pure in-memory filter: keeps only events whose `rootPostId` is in `posts`. **No I/O.** This split is intentional — pair with `getAllRippleEvents()` so the ripple query runs **in parallel** with the post query in `Promise.all`.

```ts
const [filtered, allRippleEvents] = await Promise.all([
  getPosts(filters),
  getAllRippleEvents(),
]);
const ripples = scopeRippleEventsToPosts(allRippleEvents, filtered);
```

This is what `/overview` does (`app/overview/page.tsx:47-52`).

### `getRippleEvents(filters, prefetchedPosts?)` — `lib/queries.ts:421-430`

Convenience wrapper. Use when you only need ripples (e.g. `/stream`). Pass `prefetchedPosts` if you've already fetched them to skip the second post query. Prefer the lower-level `getAllRippleEvents` + `scopeRippleEventsToPosts` pair when you also need the posts — it's strictly more parallel.

### `getPlays()` — `lib/queries.ts:432-444`

All `Play` rows, ordered by name. Used by `/plays`, `/shot-plot`, `/shot-zones`. Pair with `playMapFromPlays(plays)` (`lib/queries.ts:562-564`) to get an `id -> Play` lookup.

### `getExperiments()` — `lib/queries.ts:446-457`

All `Experiment` rows, newest first. Used by `/plays`.

### `getDataSources()` — `lib/queries.ts:459-469`

All `DataSource` rows, alphabetical. Used by `/attribution` to populate the four-column readiness card grid.

### `getAcquisitionRows()` — `lib/queries.ts:489-556`

The acquisition view: every Surface plus its employee, post count, raw activity count, last AcquisitionJob, and a folded route summary. Returns `AcquisitionSurfaceRow[]`. Used by `/acquisition`.

### `filtersFromSearchParams(searchParams)` — `lib/queries.ts:119-131`

Parses the URL search params into a `FilterState`. Every page reads its `searchParams` and pipes through this before querying. Defaults come from `defaultFilters` (`lib/constants.ts:54-63`).

### `employeeMapFromRoster(roster)` / `playMapFromPlays(plays)` — `lib/queries.ts:558-564`

Tiny helpers that build `id -> entity` lookups for components that need to render employee names or play names off ID references in posts.

---

## Aggregation patterns from `lib/aggregations.ts`

### `filterPosts(posts, filters)` — `lib/aggregations.ts:23-29`

Applies the in-memory `surface` and `Launch Window` filters. Called inside `getPosts(filters)` after the DB read.

### `sumMetrics(posts)` — `lib/aggregations.ts:31-52`

Sums the 15 numerator fields of `PostMetrics` across a post list. Returns a `PostMetrics` shape (so `socialTS`, `assistRate` etc. can be re-applied to the rolled-up totals).

```ts
const metrics = sumMetrics(filtered);
const ts = socialTS(metrics);   // re-apply scoring on the rollup
```

### `groupPosts(posts, getKey)` — `lib/aggregations.ts:113-120`

Plain bucket-by — `Record<key, Post[]>`. Generic enough to power `byPlatform`, `byEmployee`, `byArchetype`, `byCampaign` etc.

```ts
const byPlatform = groupPosts(filtered, (post) => post.platform);
const byEmployee = groupPosts(filtered, (post) => post.employeeId);
```

### `splitRows(posts, dimension)` — `lib/aggregations.ts:122-131`

Groups by one of `"platform" | "employee" | "archetype" | "contentType" | "campaign"` and rolls each group through `splitFromPosts()` (`lib/aggregations.ts:77-110`). Returns `SplitRow[]` — the row shape `/splits` renders.

### `platformCards(posts)` — `lib/aggregations.ts:133-145`

Iterates over `coreSurfaces` (the 7-platform set, see `platforms.md`) and produces `{ platform, posts, metrics, socialTS, assistRate }` per surface. Renders into the `PlatformCard` grid on `/overview`.

### `zoneSummaries(posts, zoneMode)` — `lib/aggregations.ts:147-161`

Groups by `post.zone` (basic) or `post.advancedZone` (advanced), summarizes each group, and picks the top-`socialTS` post in the group as the `bestUse`. Renders to `/shot-zones`.

### `postsByPlatform(posts, platform)` — `lib/aggregations.ts:163-165`

Trivial filter — convenience.

### `modeValue(metrics, mode)` — `lib/aggregations.ts:54-75`

The aggregator counterpart to `scoreForMode`. Reads from summed `PostMetrics`. See `metrics.md`.

---

## Standard call shapes

**Page-level "I need the corpus and the ripples":**

```ts
const filters = filtersFromSearchParams(await searchParams);
const [filtered, roster, allRippleEvents] = await Promise.all([
  getPosts(filters),
  getRoster(),
  getAllRippleEvents(),
]);
const ripples = scopeRippleEventsToPosts(allRippleEvents, filtered);
const employeeMap = employeeMapFromRoster(roster);
```

**Page-level "I just need the people":**

```ts
const employees = await getRoster();
```

**Page-level "I need posts and plays":**

```ts
const filters = filtersFromSearchParams(await searchParams);
const [filtered, plays] = await Promise.all([getPosts(filters), getPlays()]);
const playMap = playMapFromPlays(plays);
```

**A single employee with their per-platform metrics:**

```ts
const employee = await getEmployee(id);
// employee.metrics is SplitRow[]
```

---

## When to drop into raw `db.<model>.findMany`

Most analyst questions can be answered with the wrappers above. Drop down when:

- You need a field the mapper drops (e.g. `Post.rawActivityId`, `Surface.lastScrapedAt`).
- You need a query the wrappers don't expose (e.g. `RawActivity` reads, `AcquisitionJob` history).
- You need to project a narrow shape for a one-off chart and the full include cost matters.

Example raw read:

```ts
const recentJobs = await db.acquisitionJob.findMany({
  where: { status: "FAILED", createdAt: { gte: ninetyDaysAgo } },
  include: { surface: { include: { employee: true } } },
  orderBy: { createdAt: "desc" },
});
```

The Prisma client export is at `lib/db.ts` — `import { db } from "@/lib/db"`.
