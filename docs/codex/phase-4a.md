# Codex — Phase 4a: Queue Migration + Cron + Backfill + ESLint Runtime Guardrail

> **Canonical location: this file (`docs/codex/phase-4a.md`).** Cloud Codex agents read it from the working tree. A mirror lives at `~/.claude/plans/phase-4a-codex-prompt.md` for local Claude Code plan-mode sessions. If you edit one, propagate to the other; the in-repo copy wins on conflict.

---

> **You are an autonomous engineer.** This prompt is the entire briefing. You are expected to ship a mergeable PR in one pass. No partial commits, no asking for clarification. If you're stuck, follow the *Stop Conditions* at the bottom — don't guess.

---

## 0. Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Working dir** | `/Users/keeganmoody/Documents/New project` (or fresh clone in `/tmp/` — see *Local FS hang* below) |
| **Branch from** | `main` (currently after `f5f24b3 Phase 3b visual layer rewrite`) |
| **Branch to create** | `phase-4a-queue-migration` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only. Never `npm`. Never `pnpm dlx` (every script in package.json calls local binaries from `node_modules/.bin/`). |
| **Runtime** | Node 22 (Apple Silicon dev / linux/amd64 CI). Next.js 16 App Router. React 19. TS strict. Prisma 7. |
| **Database** | Neon Postgres. `DATABASE_URL` is in `.env.local` (dev) and Vercel envs (prod). Phase 4a needs DB connection live. |

**Local FS hang note.** The dev's working dir at `/Users/keeganmoody/Documents/New project` has Spotlight/Cursor file-lock issues that hang `tsc` and `prisma`. *You will not hit this.* If you ARE running on the host dev's machine and `pnpm typecheck` hangs at 0% CPU after 30s, do `cd /tmp && git clone https://github.com/keeganmoody33/every-court-vision && cd every-court-vision && pnpm install` and work there.

**State of the repo as of this prompt.** Phases 0, 1, 1.5, 2, 3a, and 3b are merged on `main`. The visual layer (intent · platform · recency) is live. The acquisition router skeleton (`lib/acquisition/router.ts` + `policies.ts` + 9 `providers/*.ts` adapters) ships in `main` from Phase 1, but **the providers are mostly stubs returning `disabled`, and the router walks them synchronously inside one HTTP request**. That synchronous walk is what 4a fixes.

---

## 1. The mission, in one sentence

**Make acquisition durable, observable, and budgeted** — replace the synchronous policy walk with Inngest step functions, replace per-platform crons with a single fan-out enqueuer, ship a one-shot backfill script, and add an ESLint rule that blocks future runtime regressions on Prisma callers.

---

## 2. Architecture decision (locked)

**Inngest, not BullMQ. Not QStash. Not a hand-rolled queue.**

Why:
- Native Vercel adapter — `app/api/inngest/route.ts` and you're done.
- Step-function model maps cleanly to "try Route 1 → wait → try Route 2 → wait" without writing a state machine.
- Durable retries per step (per-provider retry policies, not per-job).
- Web UI dashboard for forensics — failed runs with full event payload + step output.
- Free tier: 50K function runs/month covers ~1500 surfaces/day. We are nowhere near that.

The existing acquisition router (`lib/acquisition/router.ts`) becomes a thin enqueuer. The walk happens inside an Inngest function instead of inside an HTTP handler. Vercel's 60s function timeout no longer threatens us.

---

## 3. The hard contract

What Phase 3b just shipped and you may NOT regress:

- **Visual layer** — `HeatMapCourt`, `ShotPlot`, `AssistArc`, `PassingLane`, `IntentFilterChips`, the essay-recipe page wraps for `/shot-plot` and `/court-heat`. Don't touch any of these.
- **Filter contract** — `FilterState` extensions (`intentClass[]`, `outcome[]`, `platforms[]`) and `useFilters()` URL-param sync. Read-only for you.
- **Intent + recency contract from Phase 3a** — `Post.intentClass`, `Post.outcome`, `Post.x`, `Post.y`, `Post.zone`, `Post.timestamp`. Read-only.
- **`lib/intent/*` modules** — `classify.ts`, `courtMapping.ts`, `outcome.ts`, `platformColors.ts`, `recency.ts`, `metrics.ts`, `zones.ts`, `recategorize.ts`, `recategorizeCore.ts`. Read-only for you. You may CALL `recategorizeForEmployee` from inside an Inngest step; you may not modify.
- **Synthetic flag** — `Post.sourceId` nullability remains the synthetic indicator. When acquisition writes a Post, it sets `sourceId = "acquired:<provider>:<externalId>"` — that's how the SyntheticPill stops rendering.

What you ARE allowed to touch:
- `prisma/schema.prisma` — extend `AcquisitionJob` with the columns listed in §5.1. Add a `ProviderBudget` model. **Do NOT modify** `Post`, `Surface`, `RawActivity`, `Employee`, `Metric`, `Company`, `Play`, `Experiment`, `RippleEvent`, `DataSource`, `SocialAccount`, `AcquisitionRoute`, or any enum already defined.
- `lib/acquisition/router.ts` — replace synchronous walk with `inngest.send`.
- `lib/acquisition/persist.ts` — call sites only. The dedupe + classification + court-mapping logic stays.
- `vercel.json` — replace existing crons.
- `package.json` — add `inngest` + `@inngest/cli`. Add new scripts. Don't change existing scripts (the `pnpm dlx` removal already shipped in `7f967c1`).
- `app/api/scrape/route.ts` and existing acquisition routes — change return shape (return `{ jobId }` instead of full result).
- `eslint.config.mjs` — register the new local plugin.
- Create `inngest/`, `app/api/inngest/`, `app/api/cron/acquire-due/`, `scripts/backfill-acquisition.ts`, `eslint-plugin-surface-iq/`.

---

## 4. Read first (in order, before coding)

1. **[`docs/codex/phase-3b.md`](docs/codex/phase-3b.md)** — see how the previous PR was scoped. Same craft applies.
2. **[`PHASE3B_GUARDRAILS.md`](PHASE3B_GUARDRAILS.md)** — Phase 3a's locked contract; UI consumers depend on these fields. Stay on the right side of this even though you're touching infra.
3. **[`lib/acquisition/router.ts`](lib/acquisition/router.ts)** — the current ~145-line synchronous policy walk. You're replacing the engine, keeping the policy chain.
4. **[`lib/acquisition/policies.ts`](lib/acquisition/policies.ts)** — 33 policy rows. Phase 4a does NOT change them. The Inngest function loops over them just like the router does today.
5. **[`lib/acquisition/persist.ts`](lib/acquisition/persist.ts)** — called from inside the Inngest step after a provider returns `success`. Same signature.
6. **[`lib/acquisition/providers/`](lib/acquisition/providers/)** — read every adapter to confirm their `collect()` interface. Most return `{ status: "disabled" }` today; the queue plumbing must handle that gracefully.
7. **[`prisma/schema.prisma`](prisma/schema.prisma)** — `AcquisitionJob` model is at the bottom. You extend it; you don't replace it.
8. **[`lib/db.ts`](lib/db.ts)** — PrismaClient singleton. Inngest functions use this from their step bodies (Node runtime).
9. **[`lib/env.ts`](lib/env.ts)** — Zod-validated env access. Extend with two new optional vars (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`).
10. **[`.env.example`](.env.example)** — add Inngest vars + `CRON_SECRET` if not already there.
11. **Inngest Next.js docs**: <https://www.inngest.com/docs/getting-started/nextjs-quick-start> and <https://www.inngest.com/docs/learn/inngest-functions> for step functions.

---

## 5. Deliverables (4 in one PR)

### 5.1 Inngest infrastructure (replaces sync acquisition walk)

**Create:**
- `inngest/client.ts`
  ```ts
  import { Inngest } from "inngest";
  export const inngest = new Inngest({ id: "surface-iq", eventKey: process.env.INNGEST_EVENT_KEY });
  ```
- `inngest/functions/acquire-surface.ts` — the keystone. Step-function version of `runAcquisitionForSurface`. **Worked example below.**
- `inngest/functions/recategorize.ts` — chained off acquire-surface success. Calls `recategorizeForEmployee()` inside a step.
- `inngest/functions/metric-recompute.ts` — chained off recategorize. Rebuilds `Metric` rows for `7d`/`30d`/`90d` windows.
- `inngest/functions/index.ts` — barrel: `export const functions = [acquireSurface, recategorize, metricRecompute]`.
- `app/api/inngest/route.ts`
  ```ts
  import { serve } from "inngest/next";
  import { inngest } from "@/inngest/client";
  import { functions } from "@/inngest/functions";
  export const runtime = "nodejs";
  export const maxDuration = 300;
  export const { GET, POST, PUT } = serve({ client: inngest, functions });
  ```

**Modify:**
- `prisma/schema.prisma` — `AcquisitionJob` adds:
  ```
  idempotencyKey String?  @unique
  attemptNumber  Int      @default(0)
  nextAttemptAt  DateTime?
  deadLetterAt   DateTime?
  inngestRunId   String?
  ```
  And `AcquisitionJobStatus` enum adds `DEAD_LETTER`.
- `lib/acquisition/router.ts` — `runAcquisitionForSurface(surfaceId, windowDays)` becomes:
  ```ts
  // If INNGEST_EVENT_KEY is set, enqueue via Inngest. Otherwise fall back to today's sync walk
  // (preserves the local-dev workflow when there's no Inngest dev server running).
  if (env.INNGEST_EVENT_KEY) {
    const idempotencyKey = `${surfaceId}:${windowStart.toISOString()}`;
    await inngest.send({
      name: "acquisition/surface.requested",
      data: { surfaceId, windowDays, idempotencyKey },
    });
    return { jobId: idempotencyKey, status: "QUEUED" };
  }
  // existing sync walk preserved
  ```
- `package.json` — add deps: `inngest@^3` and devDep: `@inngest/cli@^1`. Add scripts: `"dev:inngest": "inngest-cli dev"` and `"dev:all": "concurrently -n next,inngest 'pnpm dev' 'pnpm dev:inngest'"` (add `concurrently` as devDep).
- `lib/env.ts` — extend Zod schema with `INNGEST_EVENT_KEY: z.string().optional()`, `INNGEST_SIGNING_KEY: z.string().optional()`. Add `flags.queueDriver: "inngest" | "sync"` derived from `INNGEST_EVENT_KEY` presence.
- `.env.example` — add `INNGEST_EVENT_KEY=` and `INNGEST_SIGNING_KEY=` with comments noting they're optional in dev (Inngest CLI auto-generates) and required in prod.

**Worked example — `inngest/functions/acquire-surface.ts`:**

```ts
import { NonRetriableError } from "inngest";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { providerFor } from "@/lib/acquisition/providers";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { persistActivities } from "@/lib/acquisition/persist";
import { canConsume, recordConsumption } from "@/lib/acquisition/budget";

const RETRY_POLICY: Record<string, { attempts: number; backoff: "exponential" | "fixed" | "none"; baseSeconds: number }> = {
  X_API: { attempts: 3, backoff: "exponential", baseSeconds: 1 },
  GITHUB_API: { attempts: 3, backoff: "exponential", baseSeconds: 1 },
  YOUTUBE_API: { attempts: 2, backoff: "fixed", baseSeconds: 5 },
  RSS: { attempts: 2, backoff: "fixed", baseSeconds: 2 },
  SPIDER: { attempts: 1, backoff: "none", baseSeconds: 0 },
  PARALLEL: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  LINKEDIN_API: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  INSTAGRAM_GRAPH: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  MANUAL: { attempts: 0, backoff: "none", baseSeconds: 0 },
};

export const acquireSurface = inngest.createFunction(
  {
    id: "acquire-surface",
    concurrency: { limit: 5, key: "event.data.surfaceId" }, // serialize per surface
    retries: 0, // we manage per-provider retries inside the function body
  },
  { event: "acquisition/surface.requested" },
  async ({ event, step, runId }) => {
    const { surfaceId, windowDays, idempotencyKey } = event.data as {
      surfaceId: string;
      windowDays: number;
      idempotencyKey: string;
    };

    const surface = await step.run("load-surface", () =>
      db.surface.findUnique({ where: { id: surfaceId }, include: { employee: true } }),
    );
    if (!surface) throw new NonRetriableError(`surface_missing:${surfaceId}`);

    // Idempotency: if a job with this key has already SUCCEEDED, short-circuit.
    const existing = await step.run("check-idempotency", () =>
      db.acquisitionJob.findUnique({ where: { idempotencyKey } }),
    );
    if (existing && (existing.status === "SUCCEEDED" || existing.status === "PARTIAL")) {
      return { ok: true, idempotent: true, jobId: existing.id };
    }

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowDays * 86_400_000);
    const policies = policiesForPlatform(surface.platform);

    const job = await step.run("create-job", () =>
      db.acquisitionJob.upsert({
        where: { idempotencyKey },
        create: {
          surfaceId, provider: policies[0]?.provider ?? "MANUAL", status: "RUNNING",
          windowStart, windowEnd, attempts: 1, startedAt: new Date(),
          idempotencyKey, inngestRunId: runId,
        },
        update: { status: "RUNNING", attempts: { increment: 1 }, startedAt: new Date(), inngestRunId: runId },
      }),
    );

    for (const policy of policies) {
      const budget = await step.run(`budget-check-${policy.provider}`, () => canConsume(policy.provider));
      if (!budget.allowed) {
        await step.run(`budget-skip-${policy.provider}`, () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: { failureCode: "budget_exhausted", failureReason: `Daily cap reached for ${policy.provider}` },
          }),
        );
        continue; // try next provider
      }

      const result = await step.run(`provider-${policy.provider}`, async () => {
        const adapter = providerFor(policy.provider);
        return adapter.collect({ surface, policy, windowStart, windowEnd });
      });

      if (result.status === "success") {
        await step.run(`persist-${policy.provider}`, () =>
          persistActivities({ surfaceId, jobId: job.id, provider: policy.provider, activities: result.activities }),
        );
        await step.run(`record-budget-${policy.provider}`, () =>
          recordConsumption(policy.provider, result.activities.length),
        );
        await step.run("mark-succeeded", () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: { status: "SUCCEEDED", provider: policy.provider, completedAt: new Date() },
          }),
        );
        await step.sendEvent("trigger-recategorize", {
          name: "acquisition/posts.recategorize-requested",
          data: { employeeId: surface.employeeId },
        });
        return { ok: true, provider: policy.provider, jobId: job.id };
      }
      // disabled / failed → continue to next policy
    }

    // all providers exhausted → dead letter
    await step.run("mark-dead-letter", () =>
      db.acquisitionJob.update({
        where: { id: job.id },
        data: {
          status: "DEAD_LETTER",
          deadLetterAt: new Date(),
          failureCode: "all_routes_failed",
          failureReason: `All ${policies.length} routes returned disabled or failed for ${surface.platform}`,
          completedAt: new Date(),
        },
      }),
    );
    return { ok: false, deadLetter: true, jobId: job.id };
  },
);
```

The other two functions (`recategorize.ts`, `metric-recompute.ts`) follow the same shape: trigger event → load context → call existing `lib/intent/*` functions inside `step.run()` → return.

### 5.2 Cron rewrite + per-provider budgets

**Create:**
- `lib/acquisition/cadence.ts` — pure function that returns surfaces due for refresh based on `(platform, lastScrapedAt)`:
  ```ts
  export async function dueSurfaces(now: Date = new Date()): Promise<Surface[]> { /* … */ }
  ```
  Cadence rules (codified from the existing source spec at `/Users/keeganmoody/Downloads/EVERY/Update_Cadence_and_Spider_Integration.md`):
  - Twitter/X: 15 minutes
  - LinkedIn, GitHub, Substack, Newsletter, Personal Site: daily at 06:00 ET
  - YouTube, Podcast, Product Hunt: weekly Monday 09:00 ET
  - Manual platforms: never auto (require user trigger)
- `lib/acquisition/budget.ts` — per-provider daily caps. **Single API:**
  ```ts
  export async function canConsume(provider: AcquisitionProvider): Promise<{ allowed: boolean; remaining: number; cap: number }>;
  export async function recordConsumption(provider: AcquisitionProvider, count: number): Promise<void>;
  ```
  Implementation: backed by a new `ProviderBudget` Prisma model `(id, provider, day Date, used Int, cap Int, @@unique([provider, day]))`. Reset implicit (new row per day; old rows stay for audit).
  Default caps from env vars with sane fallbacks: `SPIDER_DAILY_CAP=200`, `PARALLEL_DAILY_CAP=500`, `X_API_DAILY_CAP=10000`, `GITHUB_API_DAILY_CAP=4500`, `YOUTUBE_API_DAILY_CAP=8000`, `INSTAGRAM_GRAPH_DAILY_CAP=200`. `MANUAL` and `RSS` and `LINKEDIN_API` have no cap (return `{ allowed: true, remaining: Infinity, cap: Infinity }`).
- `app/api/cron/acquire-due/route.ts` — single fan-out handler:
  ```ts
  export const runtime = "nodejs";
  export async function POST(req: Request) {
    if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
    const surfaces = await dueSurfaces();
    const enqueued = await Promise.all(
      surfaces.map((s) => inngest.send({
        name: "acquisition/surface.requested",
        data: { surfaceId: s.id, windowDays: 90, idempotencyKey: `${s.id}:${todayISO()}` },
      })),
    );
    return Response.json({ enqueued: enqueued.length, surfaces: surfaces.length });
  }
  ```
  This handler must finish in < 5 seconds (just enqueues; doesn't await acquisition).

**Modify:**
- `prisma/schema.prisma` — add `ProviderBudget` model.
- `vercel.json` — replace any per-platform crons with one fan-out:
  ```json
  { "crons": [{ "path": "/api/cron/acquire-due", "schedule": "*/15 * * * *" }] }
  ```
- `.env.example` — add `CRON_SECRET=` (note: generate with `openssl rand -hex 32`) and per-provider cap vars.
- `lib/env.ts` — add the cap vars with `z.coerce.number().optional()`.

### 5.3 One-shot backfill script

**Create:**
- `scripts/backfill-acquisition.ts`:
  ```ts
  // Enqueues every Surface for an acquisition. Idempotent — repeat-safe.
  import { db } from "@/lib/db";
  import { inngest } from "@/inngest/client";

  async function main() {
    const surfaces = await db.surface.findMany({ where: { /* present: true */ } });
    let enqueued = 0;
    for (const s of surfaces) {
      const idempotencyKey = `${s.id}:backfill-${new Date().toISOString().slice(0, 10)}`;
      const existing = await db.acquisitionJob.findUnique({ where: { idempotencyKey } });
      if (existing && existing.status !== "FAILED" && existing.status !== "DEAD_LETTER") {
        console.log(`SKIP ${s.platform} ${s.handle} (already ${existing.status})`);
        continue;
      }
      await inngest.send({
        name: "acquisition/surface.requested",
        data: { surfaceId: s.id, windowDays: 90, idempotencyKey },
      });
      console.log(`ENQUEUED ${s.platform} ${s.handle}`);
      enqueued += 1;
    }
    console.log(`\nDone. Enqueued ${enqueued} of ${surfaces.length} surfaces.`);
  }

  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
  ```

**Modify:**
- `package.json` — add script: `"db:backfill": "tsx scripts/backfill-acquisition.ts"`.

### 5.4 ESLint runtime guardrail

**Create local plugin:** `eslint-plugin-surface-iq/index.ts` exporting one rule, `enforce-nodejs-runtime`:

```ts
import type { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

const PRISMA_IMPORTS = ["@/lib/db", "@/lib/queries", "@/lib/acquisition/persist"];

export const enforceNodejsRuntime = {
  meta: {
    type: "problem",
    docs: { description: "Files importing server-only DB code must export `runtime = \"nodejs\"`" },
    messages: {
      missing: "This file imports {{module}}, which uses Prisma. It must export `export const runtime = \"nodejs\"` to prevent Edge runtime regression.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const isGated =
      /\/app\/api\/.*\.ts$/.test(filename) ||
      /\/app\/.*\/page\.tsx$/.test(filename) ||
      /\/app\/.*\/layout\.tsx$/.test(filename);
    if (!isGated) return {};

    const importedPrismaModules: { node: TSESTree.ImportDeclaration; source: string }[] = [];
    let hasNodeRuntimeExport = false;

    return {
      ImportDeclaration(node) {
        const src = String(node.source.value);
        if (PRISMA_IMPORTS.some((p) => src === p || src.startsWith(`${p}/`))) {
          importedPrismaModules.push({ node, source: src });
        }
      },
      ExportNamedDeclaration(node) {
        // Look for: export const runtime = "nodejs"
        if (
          node.declaration &&
          node.declaration.type === "VariableDeclaration" &&
          node.declaration.declarations.some(
            (d) => d.id.type === "Identifier" && d.id.name === "runtime" &&
                   d.init?.type === "Literal" && d.init.value === "nodejs",
          )
        ) {
          hasNodeRuntimeExport = true;
        }
      },
      "Program:exit"() {
        if (importedPrismaModules.length > 0 && !hasNodeRuntimeExport) {
          for (const { node, source } of importedPrismaModules) {
            context.report({ node, messageId: "missing", data: { module: source } });
          }
        }
      },
    };
  },
};

export default { rules: { "enforce-nodejs-runtime": enforceNodejsRuntime } };
```

**Modify:**
- `package.json` — add `"eslint-plugin-surface-iq": "file:./eslint-plugin-surface-iq"` to devDependencies.
- `eslint.config.mjs` — register and enable the rule:
  ```js
  import surfaceIQ from "eslint-plugin-surface-iq";
  // ...
  export default [
    // ...existing config...
    {
      plugins: { "surface-iq": surfaceIQ },
      rules: { "surface-iq/enforce-nodejs-runtime": "error" },
    },
  ];
  ```

---

## 6. Test fixtures (verify before declaring done)

After your changes ship and Inngest is running locally (two terminals: `pnpm dev` + `pnpm dev:inngest`), confirm these end-to-end:

| Fixture | Expected behavior |
|---|---|
| **POST `/api/acquisition/run` with body `{ surfaceId: <Austin-twitter-surface-id>, windowDays: 90 }`** | Returns `{ jobId, status: "QUEUED" }` in <200ms. Inngest dashboard at `localhost:8288` shows `acquireSurface` running with one step per provider attempted. |
| **No providers configured (no env keys)** | `acquireSurface` walks every policy, each returns `disabled` or fails, ends in `DEAD_LETTER` status with `failureCode: "all_routes_failed"` |
| **Spider-only surface with `SPIDER_DAILY_CAP=2` and 5 enqueued runs** | First 2 succeed (or fail on real provider error), runs 3–5 record `failureCode: "budget_exhausted"` for the Spider step and fall forward to the next policy |
| **Idempotency**: re-send same `(surfaceId, windowStart)` Inngest event twice | Second invocation finds existing `AcquisitionJob` with `idempotencyKey` and returns `{ idempotent: true }` without re-running providers |
| **POST `/api/cron/acquire-due`** without `Authorization: Bearer $CRON_SECRET` | Returns `401`. With the header, returns `{ enqueued: N, surfaces: M }` in <5s |
| **`pnpm db:backfill`** | First run enqueues all surfaces, prints `ENQUEUED <platform> <handle>` per row, `Done. Enqueued N of M surfaces.` Second run prints `SKIP` for ones already running/succeeded |
| **ESLint guardrail** | Synthetic test: temporarily remove `export const runtime = "nodejs"` from `app/api/acquisition/run/route.ts` → `pnpm lint` errors with `surface-iq/enforce-nodejs-runtime`. Restore the export. |

---

## 7. Self-verification (run in this order)

```bash
# from repo root
pnpm install                 # installs inngest + @inngest/cli + concurrently + plugin
pnpm exec prisma db push     # applies AcquisitionJob columns + ProviderBudget table + DEAD_LETTER enum value
pnpm typecheck               # must pass clean
pnpm lint                    # must pass clean (the new rule applies to existing code; should be zero violations because every Prisma-touching route already exports runtime = "nodejs")
pnpm build                   # must succeed

# Two-terminal smoke
pnpm dev &
DEV_PID=$!
pnpm dev:inngest &
INNGEST_PID=$!
sleep 8

# Inngest dashboard reachable?
curl -s http://localhost:8288/health | head

# Trigger a run
curl -X POST http://localhost:3000/api/acquisition/run \
  -H "Content-Type: application/json" \
  -d '{"surfaceId":"<paste-a-real-surface-id>","windowDays":90}'

# Verify Inngest dashboard shows the function executing per-provider steps

# Cleanup
kill $DEV_PID $INNGEST_PID 2>/dev/null
lsof -ti:3000 -ti:8288 | xargs -r kill -9 2>/dev/null
```

If any step fails, fix and re-run from the top. Do not commit until everything passes.

---

## 8. PR description template

```
Phase 4a: queue migration + cron + backfill + ESLint runtime guardrail

## Summary
- Replaces synchronous acquisition policy walk with Inngest step functions
- Adds idempotency keys, retry policies per provider, and DEAD_LETTER status
- Cron rewrite: single fan-out enqueuer (5s budget) replaces per-platform crons
- Per-provider daily budget caps (ProviderBudget table) with env-driven defaults
- One-shot backfill script (`pnpm db:backfill`) for seeded surfaces
- Custom ESLint rule `surface-iq/enforce-nodejs-runtime` blocks Edge-runtime regressions on Prisma callers

## Architecture decision
Inngest, not BullMQ/QStash — see prompt §2 for the why.

## Schema changes
- AcquisitionJob: +idempotencyKey @unique, +attemptNumber, +nextAttemptAt, +deadLetterAt, +inngestRunId
- AcquisitionJobStatus enum: +DEAD_LETTER
- New: ProviderBudget(id, provider, day, used, cap, @@unique([provider, day]))

## Test plan
- [x] `pnpm typecheck && pnpm lint && pnpm build` clean
- [x] `pnpm exec prisma db push` applies cleanly
- [x] POST /api/acquisition/run returns jobId in <200ms
- [x] Inngest dashboard shows step-by-step provider walk
- [x] Idempotency: same (surfaceId, windowStart) does not double-execute
- [x] Cron handler authenticates and finishes in <5s
- [x] `pnpm db:backfill` is idempotent across reruns
- [x] ESLint rule fires on synthetic violations

## Out of scope (deferred to Phase 4b)
- Acquisition UI brand-apply (essay-recipe wrap on /acquisition page)
- Dead-letter view, JobStatusBadge, JobRetryButton, BudgetTile
- Brand handoff doc (every-lab/graph/meta/brand-handoff.md)

## Out of scope (deferred to later phases)
- Live provider implementations (most adapters still return `disabled`)
- LinkedIn/Instagram OAuth flows
- Per-employee budget caps (only per-provider in this PR)
```

---

## 9. Hard rules — what you do NOT do

1. **Do not modify** any Phase 3a/3b component or `lib/intent/*` module. You add infrastructure under it; you don't change it.
2. **Do not modify** the `Post`, `Surface`, `Employee`, `Metric`, `RawActivity`, `Company`, `Play`, `Experiment`, `RippleEvent`, `DataSource`, `SocialAccount`, `AcquisitionRoute` Prisma models, or any enum already defined. Only `AcquisitionJob` and the new `ProviderBudget` are yours.
3. **Do not** import `lib/db`, `lib/queries`, `lib/acquisition/persist`, `lib/intent/recategorize`, or `lib/intent/llm` from any file under `components/`. The ESLint rule will fire if you try.
4. **Do not** put the queue logic anywhere except `inngest/`. No "send the event from the front-end." No "fan out from a Server Component." Events are sent from Route Handlers, scripts, or Inngest functions only.
5. **Do not** swap providers, change policy ordering, or "improve" `lib/acquisition/policies.ts`. Phase 4a wires plumbing; provider work is a future phase.
6. **Do not** add new dependencies beyond `inngest`, `@inngest/cli`, `concurrently`, and the local plugin. Justify any other addition in the PR description.
7. **Do not** force-push, amend a pushed commit, or skip pre-commit hooks. Direct push to `main` fails — use `gh pr create`.
8. **Do not** commit any `.env` file or any file containing real API keys.
9. **Do not touch `lib/ingestion/pipeline.ts`** — that file is a parallel path Devin shipped in PR #11, and its dissolution is the responsibility of Phase 4B-X-provider (`docs/codex/phase-4b-x-provider.md` §5.3, which dissolves it into `lib/acquisition/*`). If you find yourself wanting to refactor it, **stop**: Phase 4A's job is queue plumbing on top of `lib/acquisition/*`, not architectural cleanup of a sibling module. If you need to call into it (you shouldn't), STOP and report.

---

## 10. Stop conditions (when to bail)

- If `prisma/schema.prisma` already has an `idempotencyKey` column or `DEAD_LETTER` enum value (someone landed it before you), **stop**. Update §5.1 to no-op those changes and ship the rest. Do not duplicate.
- If `lib/acquisition/router.ts` no longer matches the structure described in §3 (e.g., it's been rewritten by a later commit), **stop**. Re-read the new structure and adjust the enqueuer pattern; do not blindly overwrite.
- If `INNGEST_EVENT_KEY` is unset in the environment AND you can't run the Inngest dev CLI locally for some reason, you can't fully test §6. **Open a draft PR** with the diff and a note in the description; do not claim ready.
- If you find that the dev's `DATABASE_URL` is unset or pointing at a placeholder, the Inngest functions can't actually call into Prisma. **Stop and report**; the dev needs Neon set up before you can validate end-to-end.

---

## 11. After this merges

**Phase 4b** is next: brand-apply the `/acquisition` page using the essay primitives (Cover/Byline/TLDR/Lede/Figure/Pull/Section), build `DeadLetterView`, `JobStatusBadge`, `JobRetryButton`, `BudgetTile` components, and write the consolidated brand handoff doc at `every-lab/graph/meta/brand-handoff.md`. See `docs/codex/phase-4b.md` (created in tandem with this prompt) for the briefing.

---

*End of prompt. Ship clean.*
