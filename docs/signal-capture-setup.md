# Signal capture: ingestion, discovery, and Google Sheets

End-to-end setup for pulling public content into `RawPost`, mapping employee surfaces into `DiscoveredSurface`, and optionally syncing from a Google Sheet roster.

## Prerequisites

- Postgres `DATABASE_URL` (and `DIRECT_URL` if you use Neon pooling; see `prisma/schema.prisma`).
- `CRON_SECRET` for protected API routes (`/api/ingest`, `/api/discover`).
- Optional: `YOUTUBE_API_KEY`, `GITHUB_TOKEN`, `X_BEARER_TOKEN` for live ingestion.
- Optional: `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string) for `pnpm sync:sheets`.

## 1. Schema and seed

```bash
pnpm exec prisma migrate dev
pnpm seed:employees
```

`scripts/seed-employees.ts` creates company `comp_every_001` and employees `emp_001`–`emp_025` (first 16 marked public-facing for discovery scoping).

## 2. Google Sheet (optional)

1. Create a sheet and import the template: [docs/data/exhaustive-roster-template.csv](data/exhaustive-roster-template.csv).
2. Share the sheet with your Google service account email (read-only is enough).
3. Set `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env` / Vercel.

```bash
pnpm sync:sheets
```

This updates `Employee` rows and upserts `DiscoveredSurface` rows with `discoveryMethod: manual_sheet` where handle or URL cells are filled.

## 3. Discovery (queries → `DiscoveredSurface`)

The discovery engine builds search-query "evidence" per surface and persists rows (real search APIs can be wired into `searchForSurface` later).

```bash
pnpm discover:surfaces
```

## 4. Content ingestion

```bash
pnpm ingest
```

See [README_INGESTION.md](../README_INGESTION.md) for sources, env vars, and Studio checks.

## 5. HTTP APIs (Bearer `CRON_SECRET`)

| Route | Purpose |
|-------|---------|
| `GET /api/ingest` | Full or `?source=` ingestion run |
| `GET /api/discover` | Run discovery for all employees (or `?employeeId=`, `?scope=public_facing`, `?surface=x`) |

Vercel cron entries are in `vercel.json`. Crons call the same paths; ensure `CRON_SECRET` is configured so `Authorization: Bearer …` succeeds (same pattern as [Vercel cron documentation](https://vercel.com/docs/cron-jobs)).

## 6. Next steps for "real" discovery

Hook `lib/discovery/engine.ts` `searchForSurface` to Serper, Spider, or Google Custom Search using your API keys; see comments in that file.
