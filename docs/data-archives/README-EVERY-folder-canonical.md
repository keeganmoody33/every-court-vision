# Every Court Vision

> **NBA.com shot charts for your off-platform growth.**  
> A basketball analytics translation layer that helps distributed teams understand what kind of growth they already create — not a social media dashboard that tells them to post more.

---

## What It Is

Every Court Vision reframes a company's public surface activity (X, LinkedIn, newsletters, GitHub, podcasts, Product Hunt) through the lens of an **NBA film room**:

| Basketball | Growth |
|---|---|
| Shots | Posts |
| Attempts | Clicks |
| Makes | Signups |
| Three-pointers | Paid subscriptions |
| And-ones | Consulting leads |
| Assists | Teammate amplification |
| Gravity | Trust-building content |

The product answers one question: *Where does our growth actually come from, and who creates it?*

---

## Demo Walkthrough

1. **Overview** — Company-level 90-day stats, platform cards, and surface/outcome mix.
2. **Court Heat** — Interactive zone map showing where your "shots" land by scoring mode (awareness, trust, clicks, signups, paid, consulting, revenue, assists).
3. **Shot Plot** — Individual posts rendered as court points with made/miss/assist logic, hover tooltips, and a detail side panel.
4. **Players** — Player cards for teammates with archetypes, Surface IQ, Trust Gravity, Social TS%, best shot, and best assist.
5. **Splits** — NBA-style splits table (Traditional + Advanced) by platform, employee, content type, CTA, brand touch, time of day, and more.
6. **Stream** — Ripple event timeline and downstream conversion graph from root post to revenue.
7. **Plays** — Catalog of proven growth plays with best-fit platforms, structure, and next experiments.
8. **Attribution** — Connector readiness, confidence badges, and the path from public data to modeled intelligence.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 3.4 + custom dark premium tokens |
| Components | shadcn/ui primitives (Radix + CVA) |
| Animation | Framer Motion |
| Charts | Recharts + D3 |
| Tables | TanStack Table |
| Database | PostgreSQL via Prisma 7.8 |
| Icons | Lucide React |
| Validation | Zod |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (local, Supabase, Neon, or Railway)

### 1. Clone & Install

```bash
git clone https://github.com/keeganmoody33/every-court-vision.git
cd every-court-vision
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in at minimum:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
```

For live scrapes and LLM enrichment, add optional keys:

```env
OPENAI_API_KEY=          # LLM categorization fallback
SPIDER_API_KEY=          # Web scrape pipeline
PARALLEL_API_KEY=        # Discovery / enrichment
X_BEARER_TOKEN=          # X API
GITHUB_TOKEN=            # GitHub API
LINKEDIN_ACCESS_TOKEN=   # LinkedIn API
```

### 3. Database

```bash
# Push schema and generate client
pnpm db:push

# Seed with mock data (Austin, Dan, Kieran, Every company profile)
pnpm db:seed
```

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Quality Checks

```bash
pnpm lint       # ESLint
pnpm typecheck  # TypeScript --noEmit
pnpm build      # Production build
```

---

## Project Structure

```
app/
  overview/          Company profile + 90-day stats
  court-heat/        Zone-based surface heat map
  shot-plot/         Individual post scatter plot
  shot-zones/        Zone breakdown view
  players/           Teammate player cards
  splits/            Traditional & advanced splits tables
  stream/            Ripple timeline + conversion graph
  plays/             Play catalog + experiment backlog
  acquisition/       Surface acquisition pipeline
  attribution/       Connector readiness + confidence model
  api/               REST endpoints (scrape, export, etc.)

components/
  ui/                shadcn/ui primitives
  essay/             Long-form narrative components
  AppShell.tsx       Persistent nav + global filters
  CourtTelestrator.tsx  Court drawing + zone logic
  ShotPlot.tsx       D3/Recharts shot renderer
  HeatMapCourt.tsx   Zone heat map canvas
  PlayerCard.tsx     Player stat cards
  SplitsTable.tsx    TanStack splits grid
  StreamTimeline.tsx Ripple event feed
  RippleGraph.tsx    Downstream attribution graph
  SidePanel.tsx      Post detail drawer
  SyntheticPill.tsx  Confidence badge system

lib/
  types.ts           Domain types (posts, metrics, scores, plays)
  scoring.ts         Made/miss/assist/gravity math
  aggregations.ts    Filtering, sums, splits, zone summaries
  queries.ts         Data access + mock data pipelines
  constants.ts       Court zones, scoring modes, thresholds
  formatters.ts      Number/date/text formatting
  db.ts              Prisma client singleton
  env.ts             Runtime env validation (Zod)

prisma/
  schema.prisma      Postgres schema (accounts, posts, metrics, scores, events)
  seed.ts            Mock fixture loader
  fixtures/          JSON fixture data
```

---

## Key Concepts

### Scoring Modes

Switch the entire app between lenses:

- **Awareness** — Reach and impressions
- **Engagement** — Likes, replies, shares
- **Trust** — Saves, bookmarks, return visits
- **Clicks** — Link clicks and profile visits
- **Signups** — Free registrations
- **Paid** — Subscription conversions
- **Consulting** — Lead generation
- **Revenue** — Direct revenue attribution
- **Assists** — Teammate amplification

### Confidence Badges

Every data point carries a confidence level:

- **Direct** — Verified platform API data
- **Estimated** — Public feed inference with high signal
- **Modeled** — Statistical model with known assumptions
- **Hypothesis** — Pattern-based inference, needs validation
- **Needs Internal Analytics** — Requires Stripe/CRM/web hook data

### Not a Leaderboard

Player cards and splits are designed for **self-awareness**, not ranking. The goal is to help teammates understand their own shot distribution and assist network, not to pit them against each other.

---

## Roadmap

### Now (Prototype)
- [x] Full app shell with global filters
- [x] Court heat map + shot plot + side panel
- [x] Player cards for Austin, Dan, Kieran
- [x] Splits tables (Traditional + Advanced)
- [x] Stream timeline + ripple graph
- [x] Play catalog with experiment backlog
- [x] Attribution page + connector readiness
- [x] Prisma schema + mock data seed

### Next
- [ ] Expand mock data to full Every roster (16 employees)
- [ ] Live X / LinkedIn / GitHub connector pipelines
- [ ] Saved filter presets (Awareness, Trust, Consulting, Paid, Assists)
- [ ] Export: PDF report, CSV splits, player card image, post film clip
- [ ] Replay controls for ripple stream (play, pause, scrubber, speed)
- [ ] Mobile filter drawer + narrow viewport polish
- [ ] Keyboard navigation for shot plot points

### Later
- [ ] Stripe + CRM + web analytics connectors
- [ ] UTM shortener with canonical campaign URLs
- [ ] Server-side player card / PDF rendering (R2/S3)
- [ ] Clerk auth upgrade for multi-tenant teams
- [ ] LLM auto-categorization (GPT-4o-mini fallback)

---

## Product Principles

1. **Film room, not dashboard.** The metaphor is NBA.com Stats + Second Spectrum, not Hootsuite.
2. **Understand what you already create.** We do not optimize for post volume. We optimize for shot quality and assist networks.
3. **Volume, efficiency, value, and shot quality are different.** A post can miss on engagement and still score on signups. A personal post can miss direct conversion and still create trust or assists.
4. **Not a leaderboard.** Teammates are players with different roles, not competitors.
5. **Confidence is part of the UI.** Every number shows how it was derived.

---

## Attribution & Data Model

The app consumes four tiers of data:

1. **Public surface data** — X, LinkedIn, GitHub, Product Hunt, Substack (via Spider + Parallel)
2. **Authenticated platform data** — Official APIs with OAuth tokens
3. **Internal analytics** — Stripe, CRM, web analytics, UTM shortener
4. **Modeled intelligence** — Statistical inference, LLM classification, pattern matching

See `app/attribution` for connector readiness cards and the confidence upgrade path for each source.

---

## License

MIT — built for Every, open for anyone who wants to run a growth film room for their team.

---

## Credits

Built by [Keegan Moody](https://github.com/keeganmoody33) for [Every](https://every.to).  
Surface intelligence compiled via live web research.  
Mock data inspired by Austin Tedesco, Dan Shipper, and Kieran Klaassen's real public surfaces.
