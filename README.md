# Every Court Vision

_Last updated: 2026-04-29_

> Every Court Vision is a basketball analytics translation layer for growth, not a social media dashboard.
>
> The product frames Every's distributed off-platform growth like an NBA film room: posts are shots, clicks are attempts, signups are makes, paid subscriptions are threes, consulting leads are and-ones, teammate amplification is assists, and trust-building content creates gravity.
>
> The rule to preserve across product, copy, data, and demos:
>
> > This does not tell people to post more. It helps people understand what kind of growth they already create.

(Lifted verbatim from [`TODO.md:12-21`](TODO.md). The canonical mission doc lives in [`docs/MISSION.md`](docs/MISSION.md).)

## Quick start

```bash
pnpm install
cp .env.example .env            # set DATABASE_URL to your Neon Postgres
pnpm db:push                    # apply Prisma schema
pnpm db:seed                    # seed the demo roster + posts
pnpm dev                        # http://localhost:3000
```

Requires Node ≥ 20, pnpm, and a Postgres-compatible database (Neon recommended).

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Run the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint over `.` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:push` | Apply Prisma schema to the configured DB |
| `pnpm db:seed` | Seed company + roster + posts from `prisma/fixtures/` |
| `pnpm db:studio` | Open Prisma Studio against the configured DB |

## Routes

| Route | What it renders |
|---|---|
| `/` | Redirects to `/overview` |
| `/overview` | Company profile + 90-day stats (reach, engagements, clicks, signups, paid, consulting, assists, Social TS%) + platform cards + surface/outcome mix charts |
| `/court-heat` | Interactive court-zone map with scoring modes (awareness, engagement, trust, clicks, signups, paid, consulting, revenue, assists) |
| `/shot-plot` | Individual posts as court points with made/miss logic, side panel for post detail |
| `/players` | Roster cards with role, archetype, surfaces, signature move, Surface IQ, Trust Gravity, Social TS% |
| `/splits` | TanStack splits table — Traditional and Advanced tabs across platform / employee / archetype / content type / CTA / brand touch / product / campaign / launch window / time / day |
| `/stream` | Timeline of ripple events + ripple graph from root post to downstream conversion |
| `/plays` | Play cards (Soft CTA After Trust, Teammate Alley-Oop, LinkedIn Consulting Wedge, Human Halo, Launch Rotation, Newsletter Conversion Bridge, GitHub-to-LinkedIn Technical Proof) |
| `/attribution` | Data source layers (public, authenticated, internal, modeled) + connector readiness cards |
| `/acquisition` | Acquisition router status — coverage, manual import, raw activity / post counts |
| `/shot-zones` | Surface and content motion groups, zones categorized by type |

## Data model

```
Company
  ├── Surface (one per platform, no employeeId)
  └── Employee
        ├── Surface (one per (employeeId, platform))   ← @@unique enforced
        ├── SocialAccount (thinner mirror of Surface)
        ├── Post (linked to one Surface and one Employee)
        │     ├── PostMetrics
        │     ├── PostScores
        │     └── RippleEvent (downstream conversions, assists, paid)
        ├── Metric (rolled-up scores)
        └── Experiment (tied to Plays)
```

For the full schema with column-level documentation, query patterns, and metric definitions, see the data-context skill at [`.claude/skills/every-court-vision-analyst/`](.claude/skills/every-court-vision-analyst/).

## Architecture

```
External           Acquisition           Persistence       Application
─────────          ───────────           ───────────       ───────────

Parallel ─┐
Spider   ─┼──> lib/acquisition/        ─> lib/acquisition/  ─> Prisma DB
RSS      ─┤      providers/*.ts            persist.ts          (Neon)
GitHub   ─┤      router.ts                                       │
X        ─┤      policies.ts                                     │
LinkedIn ─┤      platform.ts                                     │
YouTube  ─┤                                                      │
IG       ─┘                                                      ▼
Manual ────> /api/import/activity ───────────────────────> lib/queries.ts
                                                          lib/aggregations.ts
                                                          lib/scoring.ts
                                                                 │
                                                                 ▼
                                                          app/* routes
                                                          (Next.js App Router)
                                                                 │
                                                                 ▼
                                                          CourtTelestrator,
                                                          ShotPlot, RippleGraph,
                                                          SplitsTable, etc.
```

**Discovery (Phase 5a, not yet shipped):** a per-employee surface-discovery pipeline at `lib/discovery/perEmployee.ts` will enumerate every public profile (X, LinkedIn, GitHub, Substack, Instagram, Newsletter, YouTube, Podcast appearances) using Parallel + Spider + web search and write Surface rows for downstream backfill. Spec: [`docs/codex/phase-5a-surface-discovery.md`](docs/codex/phase-5a-surface-discovery.md).

## Roadmap

The live status of every section (scaffold, data model, app shell, overview, court heat, shot plot, players, splits, stream, plays, polish, exports, narrative, connectors, release hygiene) lives in [`TODO.md`](TODO.md) with `[x]` / `[~]` / `[ ]` / `[?]` markers.

## Mission

This does not tell people to post more. It helps people understand what kind of growth they already create. Read [`docs/MISSION.md`](docs/MISSION.md) for the full framing — the translation table, the audience, what good looks like, and what this product explicitly is not.

## Not a leaderboard

Player cards, splits, and stream views surface attribution and shot quality — they are not rankings. Comparing teammates is supported (see "teammate comparison view" in `TODO.md`) but the product principle is that every shot is contextual: a hard CTA can miss on engagement and still score on signups; a personal post can miss direct conversion and still create trust or assists.
