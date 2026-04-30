# Two-Commit Publish Plan

## Summary
Split the current work into two commits on `phase-1-data-layer`: first the Phase 1/2 data layer and page rewiring, then the 90-day acquisition layer. Do not make a combined commit because `prisma/schema.prisma`, `lib/types.ts`, `.env.example`, and `prisma/seed.ts` now contain both Phase 1/2 and acquisition changes.

## Commit 1: Data Layer And Page Rewiring
- Stage Phase 1/2 changes only: Prisma 7 config/client/query layer, seed fixtures, route rewiring, `proxy.ts`, `SplitsView`, dependency updates, and `lib/mockData.ts` deletion.
- Exclude acquisition-only files: `app/acquisition/`, `app/api/`, `components/AcquisitionTable.tsx`, and `lib/acquisition/`.
- In mixed files, stage only non-acquisition hunks:
  - `.env.example`: database/password/OpenAI/Spider/cron/YouTube/R2/Clerk sections, excluding `PARALLEL_API_KEY`, `X_BEARER_TOKEN`, `GITHUB_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`.
  - `lib/types.ts`: Phase 1 data/query types, excluding acquisition provider/status/row types.
  - `prisma/schema.prisma`: Company, Surface, Metric, Report, DataSource, expanded employee/post fields, excluding `AcquisitionProvider`, `AcquisitionJobStatus`, `AcquisitionRoute`, `AcquisitionJob`, `RawActivity`, and acquisition fields on `Surface`/`Post`.
  - `prisma/seed.ts`: Phase 1 seed changes, excluding `acquisitionPolicies`, `acquisitionRoute`, `rawActivity`, and `acquisitionJob`.
- Commit message:
  `Phase 1: data layer and page query rewiring`

## Commit 2: Acquisition Layer
- Stage acquisition files and remaining acquisition hunks:
  - `app/acquisition/`
  - `app/api/acquisition/`
  - `app/api/import/activity/`
  - `components/AcquisitionTable.tsx`
  - `lib/acquisition/`
  - remaining acquisition hunks in `.env.example`, `components/AppShell.tsx`, `lib/queries.ts`, `lib/types.ts`, `prisma/schema.prisma`, and `prisma/seed.ts`.
- Commit message:
  `Add 90-day surface acquisition router`

## Verification
- Before Commit 1: run `pnpm exec prisma validate`, `pnpm exec prisma generate`, `pnpm exec prisma db push`, `pnpm db:seed`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Before Commit 2: rerun `pnpm exec prisma validate`, `pnpm exec prisma generate`, `pnpm exec prisma db push`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- The earlier `pnpm typecheck` and `pnpm lint` runs hung and were terminated, so they must be rerun before committing.
- Do not stage `.env.local`, `.next/`, `node_modules/`, or generated cache artifacts.
- Review `next-env.d.ts`; restore it before staging unless Next 16 requires the `.next/dev/types/routes.d.ts` change after a clean build.

## Assumptions
- The request is local commit only, not push/PR.
- No remote is configured right now, so a PR/push step needs a repo remote first.
- Use partial staging for mixed files; do not use `git add -A`.
