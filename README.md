# Every Court Vision

**Every Court Vision is NBA.com shot charts for Every's off-platform growth.**

A basketball analytics translation layer that frames distributed off-platform growth like an NBA film room: posts are shots, clicks are attempts, signups are makes, paid subscriptions are threes, consulting leads are and-ones, teammate amplification is assists, and trust-building content creates gravity.

---

## Product Principle: Not a Leaderboard

This does not tell people to post more. It helps people understand **what kind of growth they already create**.

Volume, efficiency, value, and shot quality are different things. A player who takes fewer shots but converts at a higher rate is not worse than a high-volume shooter. The same applies to content and growth: a personal post that builds trust over weeks is not less valuable than a hard CTA that converts immediately. Court Vision exists to surface these distinctions — not to rank teammates against each other.

---

## Setup

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL at minimum
pnpm prisma generate
pnpm dev
```

The app runs at `http://localhost:3000`.

---

## Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Start Next.js dev server                     |
| `pnpm build`         | Production build                             |
| `pnpm lint`          | Run ESLint                                   |
| `pnpm typecheck`     | Run TypeScript type checking (`tsc --noEmit`)|
| `pnpm prisma:validate` | Validate Prisma schema                    |
| `pnpm db:push`       | Push schema to database                      |
| `pnpm db:seed`       | Seed database with fixture data              |
| `pnpm db:studio`     | Open Prisma Studio                           |

---

## Route Map

| Route           | View                                                    |
| --------------- | ------------------------------------------------------- |
| `/`             | Home — entry point and navigation                       |
| `/overview`     | Company-level 90-day stats, platform cards, outcome mix |
| `/court-heat`   | Interactive court surface map with zone scoring          |
| `/shot-plot`    | Individual posts as court points with side panel         |
| `/players`      | Player cards: role, archetype, Surface IQ, signature move |
| `/splits`       | NBA-style splits table (Traditional + Advanced tabs)    |
| `/stream`       | Ripple event timeline and replay graph                  |
| `/plays`        | Play cards: codified content strategies                 |
| `/attribution`  | Attribution model, connector readiness, confidence badges |
| `/acquisition`  | Acquisition pipeline and data ingestion status          |

---

## Demo Flow

**Overview → Court Heat → Shot Plot → Players → Splits → Stream → Attribution**

Walk through the film room from macro to micro:

1. **Overview** — See the full-court picture: reach, signups, paid, assists, Social TS%.
2. **Court Heat** — Identify hot zones and cold zones by scoring mode.
3. **Shot Plot** — Drill into individual posts; open the side panel for full context.
4. **Players** — Compare archetypes and signature moves (not a leaderboard).
5. **Splits** — Cut the data by platform, content type, CTA type, time of day.
6. **Stream** — Replay the ripple graph from root post to downstream events.
7. **Attribution** — Understand data confidence levels and connector readiness.

---

## Interpretation Moments

Three examples of how Court Vision reframes "performance":

1. **Hard CTA can miss on engagement and still score on signups.**
   A promotional post may get low likes and comments (a "miss" in the engagement zone) while quietly driving direct signups. Court Vision shows the make where it matters.

2. **Personal post can miss direct conversion and still create trust or assists.**
   A reflective thread may never produce a trackable click. But it generates profile visits, DMs, and downstream teammate conversions — an assist, not a miss.

3. **LinkedIn operator post can have low reach and still score on consulting intent.**
   A niche operational post may reach 400 people. If three of them are qualified consulting leads, that's an and-one — low volume, high value.

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router)             |
| UI           | React 19, Tailwind CSS, Radix UI    |
| Language     | TypeScript (strict)                  |
| Database     | Prisma 7 + Neon Postgres            |
| Charts       | Recharts, D3                         |
| Tables       | TanStack Table                       |
| Package Mgr  | pnpm                                 |

---

## Phase Overview

| Phase | Name                          | Status       |
| ----- | ----------------------------- | ------------ |
| 0     | Scaffold & Design System      | Complete     |
| 1     | Data Model & Mock Data        | Complete     |
| 2     | App Shell & Global Filters    | Complete     |
| 3a    | Intent Classification (Data)  | Complete     |
| 3b    | Intent Classification (UI)    | Complete     |
| 4a    | Acquisition Pipeline          | Complete     |
| 4b    | Live Connectors & Cron        | In Progress  |

---

## License

Private. Internal prototype for Every.
