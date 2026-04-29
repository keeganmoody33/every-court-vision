_Last updated: 2026-04-29_

# Routes

The app exposes 11 routes total: 10 page directories under `app/` plus the `/` redirect (`app/page.tsx:1-5`, redirects to `/overview`). Every page that reads data declares `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.

**Filter state flows through the URL.** Every page parses `searchParams` via `filtersFromSearchParams()` (`lib/queries.ts:119-131`) into a `FilterState` (`lib/types.ts:62-71`). Defaults: `timeWindow=90D`, `entity=Company`, `surface=All`, `scoringMode=Signups`, `viewMode=Totals`, `attribution=Assisted`, `zoneMode=Basic`, `colorScale=Extended` (`lib/constants.ts:54-63`).

---

## `/` — root redirect

`app/page.tsx:1-5`. `redirect("/overview")`. No data read.

---

## `/overview` — the briefing essay

`app/overview/page.tsx`. The hero page — an editorial "briefing" that reads the corpus like tape.

**Renders:** the cover/byline/lede/figures essay shell, six `StatTile`s (reach/clicks/signups/paid/consulting/revenue), `OverviewFigures` (surface-mix and roster intelligence), a `CourtTelestrator` showing one root post + every attributed ripple, the `PlatformCard` grid, and `DeskNote` callouts.

**Queries (in `Promise.all`):** `getRoster()`, `getPosts(filters)`, `getAllRippleEvents()`. Then `scopeRippleEventsToPosts(allRippleEvents, filtered)` in memory (`app/overview/page.tsx:47-52`).

**Aggregations:** `sumMetrics(filtered)`, `platformCards(filtered)`, `groupPosts(filtered, p => p.platform)` and `... p => p.employeeId`. A pre-aggregated `rippleSumByRoot` `Map` selects the highest-ripple root post.

**Scoring modes that apply:** all of them — Social TS% surfaces in the TLDR, the platform cards show per-surface socialTS and assistRate. The selected `filters.scoringMode` does not yet drive a recolor on this page (it's the briefing view, not the heat view).

---

## `/court-heat` — the heat map

`app/court-heat/page.tsx`. The scoring-mode heat lens.

**Renders:** `HeatMapCourt` — a 100x100 SVG with the 9 basic zones or 12 advanced zones, shaded by the selected scoring mode and color scale.

**Queries:** `getPosts(filters)`.

**Aggregations:** done inside `HeatMapCourt`. Uses `zoneSummaries(posts, zoneMode)` (`lib/aggregations.ts:147-161`) which groups by `post.zone` (basic) or `post.advancedZone` (advanced) and applies `socialTS()` / `assistRate()` to each.

**Scoring modes that apply:** `Awareness | Engagement | Trust | Clicks | Signups | Paid Subs | Consulting Leads | Revenue | Assists` — recolors the zones. `colorScale` toggles `Traditional` vs `Extended`. `zoneMode` toggles `Basic` (9 surface zones) vs `Advanced` (12 content-shape zones).

---

## `/shot-plot` — individual posts as shots

`app/shot-plot/page.tsx`. The scatter view — every post is a circle (make), red X (miss), or purple ring (assist).

**Renders:** `ShotPlot` with the badge legend ("Blue circle = made shot", "Red X = miss", "Purple ring = assist").

**Queries (in `Promise.all`):** `getPosts(filters)`, `getRoster()`, `getPlays()`, `getAllRippleEvents()`. Then scopes ripples to filtered posts.

**Scoring modes that apply:** the make/miss/assist classifier `shotOutcome(post, mode)` (`lib/scoring.ts:34-44`) recomputes per `filters.scoringMode`. The same shot can flip between make and miss as the mode changes — that's the point.

---

## `/players` — the roster cards

`app/players/page.tsx`. Player cards plus deeper profile blocks.

**Renders:** `PlayerCard` grid (every employee), then `PlayerProfile` grid (deeper view), then a `Card` of all `SocialAccount` rows with handle + follower counts.

**Queries:** `getRoster()`. No filter parsing — this page is global.

**Scoring modes that apply:** none directly. The cards display the cached `surfacePresence`, `surfaceIQ`, `trustGravity`, `socialTS` fields stored on `Employee`.

---

## `/splits` — NBA-style splits table

`app/splits/page.tsx`. TanStack Table view of `SplitRow` data.

**Renders:** `SplitsView` — Traditional / Advanced tabs, splits by platform/employee/archetype/contentType/campaign.

**Queries (in `Promise.all`):** `getPosts(filters)`, `getRoster()`.

**Aggregations:** done inside `SplitsView`. Calls `splitRows(posts, dimension)` (`lib/aggregations.ts:122-131`) for each dimension toggle. Each `SplitRow` carries 21 columns including raw counts, rates, and `surfaceIQ / socialTS / assistRate / trustGravity / humanHalo`.

**Scoring modes that apply:** all displayed columns include the full set; the `scoringMode` filter mostly informs which column readers look at first rather than gating data.

---

## `/stream` — diffusion timeline

`app/stream/page.tsx`. Time-ordered ripple events plus a single root's ripple graph.

**Renders:** `StreamTimeline` — a chronological log of every event in scope. Then a `RippleGraph` for one specific root post (`"post-austin-ai-consulting"` if present, else the first event's root).

**Queries:** `getRippleEvents(filters)`. Note this page does not need the post set so it uses the convenience wrapper.

**Scoring modes that apply:** none — the graph and timeline render every ripple in the time window regardless of mode.

---

## `/plays` — motion library

`app/plays/page.tsx`. The seven named plays plus active experiments.

**Renders:** `PlayCard` grid of all `Play` rows, then a `Card` of `Experiment` rows with status badges and owner attribution.

**Queries (in `Promise.all`):** `getPlays()`, `getExperiments()`, `getRoster()`. No filter parsing.

**Scoring modes that apply:** none directly. Each Experiment carries its own `metric: ScoringMode` field.

---

## `/attribution` — confidence by data source

`app/attribution/page.tsx`. The four-column readiness grid: Public Surface Data / Authenticated Platform Data / Internal Analytics / Modeled Intelligence.

**Renders:** four columns of `DataSource` cards, each with a confidence badge and readiness label. Plus a confidence-badge legend at the bottom.

**Queries:** `getDataSources()`. No filter parsing.

**Scoring modes that apply:** none — this page is a data-pedigree explainer.

---

## `/acquisition` — the ingestion dashboard

`app/acquisition/page.tsx`. Surface-by-surface coverage and provider routing.

**Renders:** four `MetricCard` summary tiles (routed surfaces, live coverage, manual required, raw/posts ratio), the four-route doctrine card, and `AcquisitionTable` with a row per Surface.

**Queries:** `getAcquisitionRows()`. No filter parsing.

**Scoring modes that apply:** none — this page is operational.

---

## `/shot-zones` — zone summaries

`app/shot-zones/page.tsx`. Surface and content-motion groups with recommended plays.

**Renders:** `ShotZones` — every basic zone (or advanced zone) with summed metrics, top `socialTS` content type, and a `recommendedPlay` link.

**Queries (in `Promise.all`):** `getPosts(filters)`, `getPlays()`.

**Aggregations:** `zoneSummaries(posts, zoneMode)` (`lib/aggregations.ts:147-161`).

**Scoring modes that apply:** the per-zone `socialTS` and `assistRate` are always shown. `zoneMode` (`Basic` vs `Advanced`) toggles the grouping dimension.

---

## Quick crosswalk: which routes use which queries?

| Query | Routes |
|---|---|
| `getRoster()` | `/overview`, `/players`, `/shot-plot`, `/splits`, `/plays` |
| `getPosts(filters)` | `/overview`, `/court-heat`, `/shot-plot`, `/splits`, `/shot-zones` |
| `getAllRippleEvents()` | `/overview`, `/shot-plot` |
| `getRippleEvents(filters)` | `/stream` |
| `getPlays()` | `/shot-plot`, `/plays`, `/shot-zones` |
| `getExperiments()` | `/plays` |
| `getDataSources()` | `/attribution` |
| `getAcquisitionRows()` | `/acquisition` |

`getEmployee(id)` is not yet wired to a route — it's available for a future per-player deep page.
