# Every Signal Capture — ingestion quick start

Canonical path: **`lib/acquisition/*`**. Providers write through `persistActivities()`, which upserts `RawActivity` and normalized `Post` rows that the dashboard renders directly.

## Prerequisites

- Postgres `DATABASE_URL` (e.g. Neon)
- Optional: API keys listed below for live pulls

## Setup

```bash
# 1) Env (local: .env / .env.local — or: vercel env add …)
#    YOUTUBE_API_KEY, GITHUB_TOKEN, X_API_KEY, CRON_SECRET
#    SPIDER_API_KEY, PARALLEL_API_KEY — optional

# 2) Apply schema (pick one)
#    Prefer migrations (migration is in prisma/migrations/20260429100000_add_ingestion_rawpost/):
pnpm exec prisma migrate dev
#
#    If your DB was created only with db push (no migrations), fix drift first or use db push instead:
pnpm exec prisma db push

# 3) Seed company + employees/surfaces
pnpm db:seed

# 4) Full ingest run (project root — folder with package.json)
pnpm ingest
```

### Project root

Run `pnpm ingest` from the directory containing `package.json`, `app/`, `scripts/`.

## Cron / API

`GET /api/ingest` requires `Authorization: Bearer $CRON_SECRET`. Optional `?source=` matches `youtube`, `x_company`, `x_dan`, `x_austin`, `substack_dan`, `substack_austin`, `github`, `github_kieran`; omit source to walk every present Surface through the canonical acquisition router.

Schedules live in **`vercel.json`**; ensure `CRON_SECRET` is set on Vercel and that cron jobs can authenticate (per [Vercel cron docs](https://vercel.com/docs/cron-jobs)).

## What gets pulled (when keys are present)

| Source   | Kind    | Handle / org     |
|----------|---------|------------------|
| YouTube  | Company | @EveryInc        |
| X        | Company | @every           |
| X        | Emp     | @danshipper, @austin_tedesco |
| Substack | Emp     | danshipper, austintedesco (RSS) |
| GitHub   | Company | every-io         |
| GitHub   | Emp     | kieranklaassen   |

Inspect rows: `pnpm exec prisma studio` -> models **Post**, **RawActivity**, and **AcquisitionJob**.

## Discovery, Sheets, and roster

- **Discovery** (`DiscoveredSurface`, `DiscoveryJob`) and **Google Sheets sync**: [docs/signal-capture-setup.md](docs/signal-capture-setup.md)
- **Roster CSV template**: [docs/data/exhaustive-roster-template.csv](docs/data/exhaustive-roster-template.csv)
