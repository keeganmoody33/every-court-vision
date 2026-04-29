# EVERY.TO — EXHAUSTIVE SIGNAL CAPTURE
# Setup Guide: From Zero to Discovery in 30 Minutes

---

## WHAT YOU HAVE NOW

- Neon DB (Postgres) — connected
- Vercel — deployed
- 25 employees at Every.to — need exhaustive surface mapping
- This system: CSV → Sheet → DB → Discovery → Cron

---

## STEP 1: SEED THE DATABASE (5 min)

Run the seed script to create all 25 employees in Neon:

```bash
npx tsx scripts/seed-employees.ts
```

This creates:
- 25 Employee records
- 16 with known data (from our research)
- 9 placeholders for you to fill in

Verify in Prisma Studio:
```bash
pnpm exec prisma studio
```

---

## STEP 2: CREATE THE GOOGLE SHEET (10 min)

1. Go to sheets.google.com
2. Create new sheet: "Every Surface Intelligence"
3. Import the CSV: `every_25_exhaustive_roster.csv`
4. Share with your team (view or edit)

The sheet has 67 columns:
- Columns A-F: Employee info (id, name, role, department, public_facing, notes)
- Columns G-BN: Surface discovery columns (handle, url, status for each platform)

### How to fill it:

**For known employees (1-16):**
- Fill in handles/URLs you already know
- Set status: verified | likely | absent
- Leave blank if unknown

**For unknown employees (17-25):**
- Fill in real names/roles from Every directory
- Leave surface columns blank — discovery will fill them

---

## STEP 3: CONNECT SHEET TO DATABASE (5 min)

1. Create a Google Service Account:
   - Go to console.cloud.google.com → IAM & Admin → Service Accounts
   - Create service account → Create key (JSON) → Download

2. Add env vars to Vercel:
```
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

3. Run sync:
```bash
npx tsx scripts/sync-from-sheets.ts
```

This pulls all filled data from the sheet into Neon DB.

---

## STEP 4: RUN FIRST DISCOVERY PASS (10 min)

### Option A: Manual (run once, see what it finds)

```bash
npx tsx scripts/discover-surfaces.ts
```

This runs the discovery engine for all 25 employees across all surfaces.
Output: "emp_001: 12 surfaces discovered" etc.

### Option B: API (for production/Vercel)

```bash
# Discover all
curl https://your-app.vercel.app/api/discover

# Discover one employee
curl https://your-app.vercel.app/api/discover?employeeId=emp_001

# Discover only public-facing
curl https://your-app.vercel.app/api/discover?scope=public_facing
```

---

## STEP 5: VERIFY DISCOVERED DATA (5 min)

Check what the discovery found:

```sql
-- In Neon console or Prisma Studio
SELECT 
  e.name,
  ds.surface,
  ds.handle,
  ds.status,
  ds.confidence_score
FROM DiscoveredSurface ds
JOIN Employee e ON ds.employee_id = e.id
WHERE ds.status != 'unknown'
ORDER BY e.name, ds.surface;
```

You should see:
- Dan Shipper: x, linkedin, substack, github, product_hunt, personal_site...
- Austin Tedesco: x, linkedin, substack...
- Laura Entis: linkedin only (x = absent — this is the gap!)
- Anthony Scarpulla: nothing (invisible — decision needed)

---

## STEP 6: SET UP VERCEL CRON (5 min)

Add `vercel.json` to your project root:

```json
{
  "crons": [
    {
      "path": "/api/discover?scope=public_facing",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/scrape/x",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Deploy:
```bash
vercel --prod
```

Vercel will run discovery every morning at 6am.

---

## STEP 7: ADD SEARCH API (when ready)

The discovery engine currently generates search queries. To make it actually search:

### Option A: Serper.dev (cheapest, $50/mo)
```bash
pnpm add serper
```
Add `SERPER_API_KEY` to env.

### Option B: Spider.cloud (your existing tool)
```bash
pnpm add spider-client
```
Add `SPIDER_API_KEY` to env.

### Option C: Google Custom Search (free tier: 100 queries/day)
```bash
pnpm add googleapis
```
Add `GOOGLE_CSE_ID` and `GOOGLE_API_KEY` to env.

Update `lib/discovery/engine.ts` to call the search API in `searchForSurface()`.

---

## THE FULL FLOW

```
Every Directory → Google Sheet (manual fill)
                    ↓
            sync-from-sheets.ts
                    ↓
              Neon DB (seed)
                    ↓
            discover-surfaces.ts
                    ↓
            Search API (Serper/Spider/Google)
                    ↓
            DiscoveredSurface records
                    ↓
            Court Vision UI (Coverage Matrix)
                    ↓
            Vercel Cron (daily refresh)
```

---

## WHAT YOU GET

After setup, you have:

1. **Single source of truth**: Google Sheet = human-editable, DB = queryable
2. **Exhaustive coverage**: 20+ surfaces per employee, not just X/LinkedIn
3. **Discovery history**: `DiscoveryJob` table tracks every scan
4. **Confidence scoring**: Each surface has a 0-1 confidence score
5. **Gap detection**: "Laura has no X" = automatic opportunity flag
6. **Recurring sync**: Cron keeps data fresh without manual work

---

## NEXT: CONTENT INGESTION

Once surfaces are mapped, the next phase is scraping content from each surface:

```
Phase 4A: Surface Discovery ✅ (this)
Phase 4B: Content Ingestion (X API → posts table)
Phase 4C: Classification (intentClassifier → shotType)
Phase 4D: Attribution (Stripe → conversion join)
```

---

## FILES IN THIS PACKAGE

| File | Purpose |
|------|---------|
| `every_25_exhaustive_roster.csv` | Google Sheet template |
| `prisma_schema_discovery_addition.txt` | Add to schema.prisma |
| `lib_discovery_engine.ts` | Discovery logic (lib/discovery/engine.ts) |
| `app_api_discover_route.ts` | API route (app/api/discover/route.ts) |
| `scripts_discover_surfaces.ts` | Standalone discovery script |
| `scripts_sync_from_sheets.ts` | Sheet → DB sync |
| `vercel_cron.json` | Vercel cron config |
| `SETUP_GUIDE.md` | This file |

---

## ONE-COMMAND START

If you want to skip the guide and just run:

```bash
# 1. Add schema
# Copy prisma_schema_discovery_addition.txt into schema.prisma
pnpm exec prisma migrate dev --name add_discovery

# 2. Seed employees
npx tsx scripts/seed-employees.ts

# 3. Import your sheet data (after you fill it)
npx tsx scripts/sync-from-sheets.ts

# 4. Run discovery
npx tsx scripts/discover-surfaces.ts

# 5. Open Prisma Studio to verify
pnpm exec prisma studio
```

Done. You now have exhaustive surface intelligence for 25 employees.
