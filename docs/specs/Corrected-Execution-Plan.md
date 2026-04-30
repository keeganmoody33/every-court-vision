# Corrected Execution Plan: Web View, Commit, Repo, PR

## Summary
Run the publish flow from `/Users/keeganmoody/Documents/New project`, not the detached `.codex` worktree. The web-view fix is local runtime setup plus Prisma env loading: `node_modules` exists in the original checkout, Postgres is already listening on `127.0.0.1:55432`, and the DB has `16` employees, `82` surfaces, and `200` posts. Before git work, verify the data in Prisma Studio and make Prisma/seed commands read `.env.local` without inline `DATABASE_URL`.

## Key Corrections
- Do not reinstall unless needed: original checkout has `node_modules/.pnpm`.
- Fix `prisma.config.ts` to explicitly load `.env` then `.env.local`; plain `dotenv/config` does not load `.env.local`.
- Also update `prisma/seed.ts` env loading, because `pnpm db:seed` runs `tsx` directly and does not automatically use `prisma.config.ts`.
- Keep `datasource: { url: env("DATABASE_URL") }` in `prisma.config.ts`; Prisma 7 requires datasource config somewhere because schema has no `url`.
- Do not mention `ScrapeJob` in this commit/PR; the master plan assigns `ScrapeJob` to Phase 4, not Phase 1/2.

## Execution Commands
```bash
# Preflight
cd "/Users/keeganmoody/Documents/New project"
git status --short --branch
git log -1 6933036 --oneline
gh auth status
test -d node_modules/.pnpm && echo "node_modules present" || echo "node_modules missing"
test -d node_modules/@prisma/client && echo "prisma client present" || echo "prisma client missing"
psql -h 127.0.0.1 -p 55432 -d surfaceiq -Atc "select 'employees=' || count(*) from \"Employee\"; select 'surfaces=' || count(*) from \"Surface\"; select 'posts=' || count(*) from \"Post\";"
```

Create branches only if absent/current state matches preflight:
```bash
git show-ref --verify --quiet refs/heads/main || git branch main 6933036
git switch -c phase-1-data-layer
```

Create ignored local env:
```bash
cat > .env.local <<'EOF'
DATABASE_URL="postgresql://keeganmoody@localhost:55432/surfaceiq?schema=public"
EOF

git check-ignore .env.local
```

Patch Prisma env loading:
```ts
// prisma.config.ts
import { config } from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { path: path.join("prisma", "migrations") },
  datasource: { url: env("DATABASE_URL") },
});
```

Patch `prisma/seed.ts` to replace `import "dotenv/config";` with:
```ts
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });
```

Then run:
```bash
pnpm add -D dotenv
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma db push
pnpm db:seed

pnpm typecheck
pnpm lint
pnpm build
! rg "mockData" lib app components prisma -g '*.ts' -g '*.tsx'
pnpm exec prisma studio
```

For the web view, start dev in a separate terminal/session:
```bash
pnpm dev --hostname 127.0.0.1 --port 3000
```

Verify with browser/Computer Use:
```text
http://127.0.0.1:3000/overview
/court-heat
/shot-plot
/shot-zones
/stream
/splits
/players
/plays
/attribution
```

Commit with explicit staging:
```bash
git add prisma/ prisma.config.ts lib/ proxy.ts .env.example package.json pnpm-lock.yaml app/ components/
git status --short
git diff --cached --name-only
git commit -m "Phase 1: data layer + Phase 2: page query rewiring

- Add Prisma 7 config and adapter-backed data access
- Extend schema with company, surface, metric, experiment, and report data
- Seed all 16 employees from the intel report; full posts for 8 from roster JSON
- Replace lib/mockData.ts with server-only query helpers
- Rewire all 9 routes to fetch via Server Components

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Create repo and PR:
```bash
gh repo view keeganmoody33/every-court-vision >/dev/null 2>&1 || \
  gh repo create keeganmoody33/every-court-vision --private --source=. --remote=origin

git remote get-url origin
git push -u origin main
git push -u origin phase-1-data-layer

gh pr create --base main --head phase-1-data-layer \
  --title "Phase 1+2: data layer, seed, and page query rewiring" \
  --body-file /tmp/every-court-vision-pr-body.md
```

## PR Body
```md
## Summary
- Stands up Prisma 7 + Postgres data layer and seeds all 16 employees from the intelligence report
- Adds full surface analytics + ~200 posts for the 8 in `every_roster_data.json`
- Keeps empty-state contract for the 8 awaiting-scrape players
- Deletes `lib/mockData.ts`; all 9 routes now read from `lib/queries.ts`

## Scope
Implements Phase 1 and Phase 2 of `~/.claude/plans/users-keeganmoody-downloads-every-extra-keen-whale.md`.

## Test plan
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] `rg mockData lib app components prisma` returns 0 hits
- [ ] All 9 routes render against seeded DB at http://127.0.0.1:3000
- [ ] Prisma Studio shows 1 Company, 16 Employees, 30+ Surfaces, ~200 Posts
```

## Acceptance
- `.env.local` is ignored and not staged.
- `prisma.config.ts` is in the diff and supports Prisma commands without inline `DATABASE_URL`.
- `prisma/seed.ts` reads `.env.local` directly.
- Seed counts match expected shape after reseed.
- Browser can load all 9 routes from `127.0.0.1:3000`.
- PR opens against `main` with `phase-1-data-layer` as head.

## After PR Opens
Next branch should be Phase 3: Categorization Engine + Court Mapping. It should run after this PR is open, and it should not include Phase 4 scraping or `ScrapeJob` yet.
