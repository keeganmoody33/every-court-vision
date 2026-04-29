# Every Signal Capture — Quick Start

## Prerequisites
- Neon DB connected
- Vercel project set up
- API keys acquired

## Setup (5 minutes)

```bash
# 1. Add env vars
vercel env add YOUTUBE_API_KEY
vercel env add GITHUB_TOKEN
vercel env add X_BEARER_TOKEN
vercel env add SPIDER_API_KEY      # optional
vercel env add PARALLEL_API_KEY    # optional
vercel env add CRON_SECRET         # any random string

# 2. Add Prisma schema
# Copy prisma_additions.txt into schema.prisma

# 3. Migrate
pnpm exec prisma migrate dev --name add_ingestion

# 4. Seed employees
npx tsx scripts/seed-employees.ts

# 5. Run ingestion
npx tsx scripts/ingest-all.ts
```

## What Gets Ingested

| Source | Entity | Handle | Auth |
|--------|--------|--------|------|
| YouTube | Company | @EveryInc | API key |
| X | Company | @every | Bearer token |
| X | Employee | @danshipper | Bearer token |
| X | Employee | @austin_tedesco | Bearer token |
| Substack | Employee | danshipper | None (RSS) |
| Substack | Employee | austintedesco | None (RSS) |
| GitHub | Company | EveryInc | Token |
| GitHub | Employee | kieranklaassen | Token |

## API Endpoints

```bash
# Run full ingestion (protected by CRON_SECRET)
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/ingest

# Run single source
curl -H "Authorization: Bearer $CRON_SECRET" "https://your-app.vercel.app/api/ingest?source=youtube"
```

## Cron Schedule (vercel.json)

- YouTube: Daily at 6am
- X Company: Every 6 hours
- X Dan: Every 6 hours
- GitHub: Daily at 9am
