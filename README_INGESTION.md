# Every Signal Capture — ingestion quick start

Staging table: **`RawPost`** (`lib/ingestion/pipeline.ts`). Normalize into `Post` / `RawActivity` in a later step.

## Prerequisites

- Postgres `DATABASE_URL` (e.g. Neon)
- Optional: API keys listed below for live pulls

## Setup

```bash
# 1) Env (local: .env / .env.local — or: vercel env add …)
#    YOUTUBE_API_KEY, GITHUB_TOKEN, X_BEARER_TOKEN, CRON_SECRET
#    SPIDER_API_KEY, PARALLEL_API_KEY — optional

# 2) Apply schema (pick one)
#    Prefer migrations (migration is in prisma/migrations/20260429100000_add_ingestion_rawpost/):
pnpm exec prisma migrate dev
#
#    If your DB was created only with db push (no migrations), fix drift first or use db push instead:
pnpm exec prisma db push

# 3) Seed company + employees (ids line up with ingestion)
npx tsx scripts/seed-employees.ts

# 4) Full ingest run (project root — folder with package.json)
npx tsx scripts/ingest-all.ts
```

### Project root

Run `npx tsx scripts/ingest-all.ts` from the directory containing `package.json`, `app/`, `scripts/`.

## Cron / API

`GET /api/ingest` requires `Authorization: Bearer $CRON_SECRET`. Optional `?source=` matches `youtube`, `x_company`, `x_dan`, `x_austin`, `substack_dan`, `substack_austin`, `github`, `github_kieran`; omit source for **`runFullIngestion()`**.

Schedules live in **`vercel.json`**; ensure `CRON_SECRET` is set on Vercel and that cron jobs can authenticate (per [Vercel cron docs](https://vercel.com/docs/cron-jobs)).

## What gets pulled (when keys are present)

| Source   | Kind    | Handle / org     |
|----------|---------|------------------|
| YouTube  | Company | @EveryInc        |
| X        | Company | @every           |
| X        | Emp     | @danshipper, @austin_tedesco |
| Substack | Emp     | danshipper, austintedesco (RSS) |
| GitHub   | Company | EveryInc         |
| GitHub   | Emp     | kieranklaassen   |

Inspect rows: `pnpm exec prisma studio` → model **RawPost**.

## Discovery, Sheets, and roster

- **Discovery** (`DiscoveredSurface`, `DiscoveryJob`) and **Google Sheets sync**: [docs/signal-capture-setup.md](docs/signal-capture-setup.md)
- **Roster CSV template**: [docs/data/exhaustive-roster-template.csv](docs/data/exhaustive-roster-template.csv)
