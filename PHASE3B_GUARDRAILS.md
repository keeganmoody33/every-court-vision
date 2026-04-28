# Phase 3b guardrails (UI only)

Phase 3a locks the data contract. Phase 3b can generate UI *against* that contract, but must not expand it.

## Locked post-level fields (UI props)

- `intentClass` (enum): `threePoint | midRange | paint | freeThrow | pass`
- `intentConfidence` (number 0..1)
- `outcome` (enum): `made | missed | turnover`
- `recovered` (boolean)
- `isAssist` (boolean)
- `platform` (enum): from `Platform` in `lib/types.ts`
- `publishedAt` (timestamp)
- `x`, `y` (numbers, stable + deterministic)
- `zone` (string; stable labels like `threePoint.leftWing`, `pass.top`, `outOfBounds.leftRim`, etc.)
- `classifiedAt` (timestamp | null)
- `classifiedBy` (string | null): `"keyword" | "llm" | "manual"` plus any future sources

## Locked metric rollups (Phase 3a generated)

Persisted intent efficiency rollups live on `Metric` (see `prisma/schema.prisma`):

- attempts/makes/turnovers counts: `totalAttempts`, `threePtAttempts`, `midAttempts`, `paintAttempts`, `ftAttempts`, `passes`, `turnovers`, `threePtMade`, `midMade`, `paintMade`
- rate stats: `threePtPct`, `midPct`, `paintPct`, `fgPct`, `effectiveFgPct`, `trueShootingPct`
- pacing + mix: `pacePerWeek`, `brandTouchEvery`, `brandTouchPersonal`, `assistsCreated`

## What Phase 3b must NOT do

- Add new Prisma fields that would change persistence contracts for `Post` or `Metric`.
- Add cron routes, background jobs, or scheduled refinement. (Phase 4 owns cron wrappers.)
- Add new “shadow” classification systems (no parallel enums/scores for the same concept).
- Move business logic into components (classification, outcome, coord mapping remain in `lib/intent/*`).

## Allowed Phase 3b work

- Components and pages that render the locked fields above.
- Visual encoding (colors, recency) based on `lib/intent/platformColors.ts` and `lib/intent/recency.ts`.
- Tables/charts that consume the persisted `Metric` rollups without recomputing or reclassifying.

## PR checklist for Phase 3b

- No changes in `prisma/schema.prisma` (or if there are, it is a Phase 3a contract PR, not “UI”).  
- No writes to `Post` / `Metric` from UI routes/components.
- No imports of DB/LLM modules in components (`lib/db`, `lib/intent/llm`, `lib/intent/recategorize`).
- Any new UI code treats the above fields as the single source of truth.
