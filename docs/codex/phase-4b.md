# Codex — Phase 4b: Brand-Applied Acquisition UI + Brand Handoff Doc

> **Canonical location: this file (`docs/codex/phase-4b.md`).** Cloud Codex agents read it from the working tree. A mirror lives at `~/.claude/plans/phase-4b-codex-prompt.md` for local Claude Code plan-mode sessions. If you edit one, propagate to the other; the in-repo copy wins on conflict.

---

> **You are an autonomous engineer.** This prompt is the entire briefing. You are expected to ship a mergeable PR in one pass. No partial commits, no asking for clarification. If you're stuck, follow the *Stop Conditions* at the bottom — don't guess.

---

## 0. Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Working dir** | `/Users/keeganmoody/Documents/New project` (or `/tmp/` clone — see *Local FS hang* below) |
| **Branch from** | `main` (after Phase 4a has merged) |
| **Branch to create** | `phase-4b-acquisition-ui` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only. No `pnpm dlx`. |
| **Runtime** | Node 22, Next 16 App Router, React 19, TS strict, Prisma 7 |
| **Database** | Neon Postgres. Live `DATABASE_URL` required. |

**Local FS hang note.** If `pnpm typecheck` hangs at 0% CPU on the dev's machine after 30s, work in a `/tmp/` clone instead.

**Sequencing.** This PR depends on Phase 4a (Inngest queue + cron + budgets) being merged. If `pnpm typecheck` fails because `inngest/client.ts` or `lib/acquisition/budget.ts` doesn't exist, **stop**. Phase 4a hasn't landed yet; come back after it does.

---

## 1. The mission, in one sentence

**Make the `/acquisition` surface feel like part of the same publication as `/overview`** — by wrapping the acquisition admin pages in the essay vocabulary, building four new visual components for queue state (status badge, dead-letter view, retry button, budget tile), and writing the consolidated brand handoff doc that closes the "no canonical brand reference" gap.

---

## 2. The hard contract

**What 4a just shipped that you may NOT regress:**
- `inngest/client.ts`, `inngest/functions/{acquire-surface,recategorize,metric-recompute}.ts`, `app/api/inngest/route.ts` — the queue plumbing. Read-only.
- `lib/acquisition/router.ts` — `runAcquisitionForSurface` enqueues via Inngest when configured. You CALL it; you don't change it.
- `lib/acquisition/cadence.ts` and `lib/acquisition/budget.ts` — pure data sources. You consume; don't modify.
- `prisma/schema.prisma` `AcquisitionJob` extensions and `ProviderBudget` model. Read-only.
- The `surface-iq/enforce-nodejs-runtime` ESLint rule. **Every new `app/api/*` Route Handler and `app/**/page.tsx` you create or modify that imports `lib/db`/`lib/queries`/`lib/acquisition/persist` MUST export `runtime = "nodejs"`. If you forget, lint fails.**

**What Phase 3a/3b shipped that you may NOT regress:**
- The intent visual layer (`HeatMapCourt`, `ShotPlot`, `AssistArc`, `PassingLane`, `IntentFilterChips`)
- `Post` UI contract — `intentClass`, `outcome`, `x`, `y`, `zone`, `timestamp`, `sourceId`
- The essay vocabulary in `components/essay/` — you USE these primitives, you don't change them
- `SyntheticPill.tsx` semantics — renders when `!post.sourceId || !sourceId.startsWith("acquired:")`

**What you ARE allowed to touch:**
- `app/acquisition/page.tsx` — full rewrite (use essay recipe)
- `app/acquisition/jobs/[id]/page.tsx` — full rewrite (currently stub or deleted)
- `components/AcquisitionTable.tsx` — restyle to use tokens + brand utilities
- Create `components/JobStatusBadge.tsx`, `components/DeadLetterView.tsx`, `components/JobRetryButton.tsx`, `components/BudgetTile.tsx`
- Create `every-lab/graph/meta/brand-handoff.md` (the handoff doc)
- Add a one-line `docs/BRAND.md` pointer in this repo
- `tailwind.config.ts` — minor: extend with chip-accent semantic tokens IF you find yourself repeating colors. Don't redefine `paper.*`/`halftime.*`/`court.*`/`confidence.*`.

---

## 3. Read first (in order)

1. **[`docs/codex/phase-4a.md`](docs/codex/phase-4a.md)** — what just shipped. You consume its surface area.
2. **[`docs/codex/phase-3b.md`](docs/codex/phase-3b.md)** — the most recent UI prompt. Same craft applies.
3. **[`PHASE3B_GUARDRAILS.md`](PHASE3B_GUARDRAILS.md)** — Phase 3a's locked data contract.
4. **[`app/overview/page.tsx`](app/overview/page.tsx)** — **the canonical essay recipe.** Cover → Byline → TLDR → Lede w/ drop-cap → Body → Figure → Figure → Figure → Pull → Section. `/acquisition` adopts this rhythm.
5. **[`app/shot-plot/page.tsx`](app/shot-plot/page.tsx)** — Phase 3b's adoption of the recipe. Mirror the structure.
6. **[`components/essay/index.ts`](components/essay/index.ts)** — vocabulary barrel. Use only these primitives plus your four new components.
7. **[`components/AcquisitionTable.tsx`](components/AcquisitionTable.tsx)** — current implementation. Restyle, don't rewrite end-to-end.
8. **[`app/globals.css`](app/globals.css)** — token source. `paper.*` / `halftime.*` / `court.*` / `confidence.*` palettes + `.prose-essay` / `.drop-cap` / `.chalk-stroke` / `.reveal-underline` utilities.
9. **[`tailwind.config.ts`](tailwind.config.ts)** — token bindings. Five-font setup (Fraunces, Geist, Geist Mono, Permanent Marker, Anton).
10. **[`prisma/schema.prisma`](prisma/schema.prisma)** — read `AcquisitionJob`, `AcquisitionRoute`, `Surface`, `Employee`, `RawActivity`, `ProviderBudget`. You're rendering data from these.
11. **[`/Users/keeganmoody/every-lab/graph/themes/every-design-system.md`](file:///Users/keeganmoody/every-lab/graph/themes/every-design-system.md)** — 18.5KB brand audit. **Read it fully before writing the brand handoff doc in §5.5.** Cite specific line ranges in the handoff.
12. **[`/Users/keeganmoody/every-lab/graph/essays/the-folder-is-the-agent.md`](file:///Users/keeganmoody/every-lab/graph/essays/the-folder-is-the-agent.md)** and **`every-lab/graph/essays/living-software.md`** — voice cues for any UI copy you write (eyebrows, deks, TLDR bullets, Pull quotes).

---

## 4. Deliverables (5 in one PR)

### 4.1 Restyle `components/AcquisitionTable.tsx`

Don't rebuild — restyle. Replace bespoke className strings with token-driven utilities:
- Column heads → `text-eyebrow tracking-wider text-paper-muted`
- Row hover → add `.reveal-underline` class for the micro-animation
- Status column → use the new `<JobStatusBadge>` (5.2) instead of inline color logic
- Confidence column → `text-confidence-direct` / `text-confidence-inferred` / `text-confidence-modeled` based on the value
- Strip ALL hardcoded hex literals — token utilities only

### 4.2 New `components/JobStatusBadge.tsx`

```tsx
"use client";
import type { AcquisitionJobStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AcquisitionJobStatus, string> = {
  SUCCEEDED:    "border-confidence-direct bg-confidence-direct/15 text-confidence-direct",
  PARTIAL:      "border-confidence-inferred bg-confidence-inferred/15 text-confidence-inferred",
  RUNNING:      "border-paper-muted bg-paper-tinted text-paper-base animate-pulse",
  QUEUED:       "border-paper-muted bg-paper-tinted text-paper-muted",
  FAILED:       "border-court-red bg-court-red/15 text-court-red",
  DEAD_LETTER:  "border-court-red bg-court-red/25 text-court-red",
  DISABLED:     "border-paper-muted bg-paper-base text-paper-muted opacity-60",
};

export function JobStatusBadge({ status }: { status: AcquisitionJobStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider", STATUS_STYLES[status])}>
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}
```

### 4.3 New `components/DeadLetterView.tsx` (Server Component)

Renders a `<Figure>` titled *"Stuck Surfaces — manual recovery required"* with:
- **Header `<StatTile>` row** — counts: total dead-letter jobs, by platform, by failure code
- **Per-job rows** — surface handle, platform, last attempted provider, failure code, failure reason, age, **`<JobRetryButton jobId={job.id} surfaceId={job.surfaceId} />`**
- Empty state: "No stuck surfaces. The roster is acquiring cleanly." in `text-paper-muted italic` — render this when zero dead-letter jobs

```tsx
import { db } from "@/lib/db";
import { Figure, StatTile } from "@/components/essay";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { JobRetryButton } from "@/components/JobRetryButton";

export const runtime = "nodejs";  // <-- ESLint rule will catch you if you forget this

export async function DeadLetterView() {
  const jobs = await db.acquisitionJob.findMany({
    where: { status: "DEAD_LETTER" },
    include: { surface: { include: { employee: true } } },
    orderBy: { deadLetterAt: "desc" },
  });

  if (jobs.length === 0) {
    return (
      <Figure title="Stuck Surfaces" caption="Manual recovery view">
        <p className="text-paper-muted italic">No stuck surfaces. The roster is acquiring cleanly.</p>
      </Figure>
    );
  }

  // ...render StatTile row + per-job rows...
}
```

### 4.4 New `components/JobRetryButton.tsx` (Client Component)

```tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function JobRetryButton({ surfaceId, jobId }: { surfaceId: string; jobId: string }) {
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle");

  async function retry() {
    setState("pending");
    const res = await fetch("/api/acquisition/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surfaceId, windowDays: 90 }),
    });
    setState(res.ok ? "success" : "error");
  }

  return (
    <button
      type="button"
      onClick={retry}
      disabled={state === "pending"}
      className={cn(
        "rounded-md border border-paper-muted/40 px-2.5 py-1 text-[11px] uppercase tracking-wider transition",
        "hover:border-confidence-direct hover:text-confidence-direct",
        state === "pending" && "opacity-60 chalk-stroke",
        state === "success" && "border-confidence-direct text-confidence-direct",
        state === "error" && "border-court-red text-court-red",
      )}
    >
      {state === "idle" && "Retry"}
      {state === "pending" && "Enqueueing…"}
      {state === "success" && "Queued"}
      {state === "error" && "Failed"}
    </button>
  );
}
```

The chalk-stroke utility is already in `globals.css` from PR #6 — it gives the button a brief annotation-style animation on click.

### 4.5 New `components/BudgetTile.tsx` (Server Component)

```tsx
import { db } from "@/lib/db";
import type { AcquisitionProvider } from "@prisma/client";
import { StatTile } from "@/components/essay";

export const runtime = "nodejs";

export async function BudgetTile({ provider }: { provider: AcquisitionProvider }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const row = await db.providerBudget.findUnique({ where: { provider_day: { provider, day: today } } });
  const used = row?.used ?? 0;
  const cap = row?.cap ?? Infinity;
  const ratio = cap === Infinity ? 0 : used / cap;
  const tone =
    ratio > 0.9 ? "text-court-red" :
    ratio > 0.6 ? "text-confidence-inferred" :
    "text-confidence-direct";

  return (
    <StatTile
      label={`${provider} (today)`}
      value={cap === Infinity ? `${used}` : `${used} / ${cap}`}
      tone={tone}
      caption={cap === Infinity ? "no cap" : `${Math.round((1 - ratio) * 100)}% remaining`}
    />
  );
}
```

### 4.6 Rewrite `app/acquisition/page.tsx` with the essay recipe

```tsx
import { Essay, Cover, Byline, TLDR, Lede, Body, Figure, Pull, Section } from "@/components/essay";
import { AcquisitionTable } from "@/components/AcquisitionTable";
import { DeadLetterView } from "@/components/DeadLetterView";
import { BudgetTile } from "@/components/BudgetTile";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AcquisitionPage() {
  const [routes, jobs] = await Promise.all([
    db.acquisitionRoute.findMany({ orderBy: [{ platform: "asc" }, { routeOrder: "asc" }] }),
    db.acquisitionJob.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { surface: { include: { employee: true } } } }),
  ]);

  return (
    <Essay>
      <Cover
        eyebrow="Acquisition Routes"
        title="How surfaces become signal"
        dek="Nine providers, one policy chain, full compliance."
      />
      <Byline agent="Bobbito" date={new Date().toISOString()} issue="Vol. 1" />
      <TLDR
        bullets={[
          "Each surface is acquired through a policy chain that prefers official APIs first, falls forward to discovery, never bypasses logged-in feeds.",
          "Inngest carries the work; budgets cap each provider; dead-letter status surfaces stuck routes for manual recovery.",
          "Every row below is auditable — provider, attempt count, last error, and confidence travel with the post.",
        ]}
      />
      <Lede>
        <Body dropCap>
          Compliance lives in the routing table, not in the diff log. Every policy is a row. Every attempt is a job. Every failure is a code.
        </Body>
      </Lede>
      <Figure title="Fig. 01 · Daily provider budgets" caption="Caps reset at midnight UTC. Manual and RSS providers have no cap.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <BudgetTile provider="X_API" />
          <BudgetTile provider="GITHUB_API" />
          <BudgetTile provider="YOUTUBE_API" />
          <BudgetTile provider="SPIDER" />
          <BudgetTile provider="PARALLEL" />
          <BudgetTile provider="INSTAGRAM_GRAPH" />
        </div>
      </Figure>
      <Figure title="Fig. 02 · Recent acquisition jobs" caption="Last 50 attempts across the policy chain.">
        <AcquisitionTable rows={jobs} />
      </Figure>
      <DeadLetterView />
      <Pull>Compliance lives in the routing table, not in the diff log.</Pull>
      <Section />
    </Essay>
  );
}
```

### 4.7 Rewrite `app/acquisition/jobs/[id]/page.tsx`

Job detail page with the same essay shell. Show: surface info, provider attempts timeline (one row per `step.run` from the Inngest job), raw activity preview (first 3 `RawActivity` rows persisted), retry CTA if status is `FAILED` or `DEAD_LETTER`.

### 4.8 Brand handoff doc — `every-lab/graph/meta/brand-handoff.md`

**Single canonical brand reference.** Lives in `every-lab` (separate repo at `/Users/keeganmoody/every-lab/`) because every-lab is the knowledge graph / source of truth. This repo carries a one-line pointer (4.9).

**File path: `/Users/keeganmoody/every-lab/graph/meta/brand-handoff.md`** (you create the `meta/` directory if it doesn't exist).

Sections:
1. **Intent.** One paragraph. What "Court Vision" is, why basketball, what "Every editorial × ESPN chalk-on-court × hex.tech figure rhythm × rare NBA Street GameBreaker" means in one sentence each.
2. **Token cheatsheet** — verbatim from `tailwind.config.ts` and `globals.css`. Colors (`paper.*`, `halftime.*`, `court.*`, `confidence.*`), type scale (`text-eyebrow`, `text-figure-title`, `text-essay-title`, `text-stat-xl`, `text-pull-quote`, `prose-essay`), font families (`font-serif`/Fraunces, `font-sans`/Geist, `font-mono`/Geist Mono, `font-chalk`/Permanent Marker, `font-gamebreaker`/Anton), animations (`chalk-stroke`, `reveal-underline`, `draw-in`, `drift`, `hologram`, `count-rise`, `gamebreaker`).
3. **Five fonts and when each fires.** One paragraph each. Fraunces is the editorial spine. Permanent Marker is for `.chalk-stroke` annotations. Anton is for `.gamebreaker` overlays — both rare.
4. **Essay vocabulary** — one short paragraph per primitive citing line range in `components/essay/<file>.tsx`: `Cover`, `Byline`, `TLDR`, `Lede` (with `Body` and `Pull`), `Figure` (with `StatTile`), `FourTierFeedback`, `ReadWith`, `Section`, `Eyebrow`, `EssayTitle`, `Essay`.
5. **Canonical recipe** — copy the rhythm from `app/overview/page.tsx` as a numbered list (Cover → Byline → TLDR → Lede w/ drop-cap → Body → Figure × N → Pull → Section).
6. **Forbidden zones** — *what NOT to do*:
   - Don't put `court.*` tokens on chrome — they're for the basketball viz layer
   - Don't auto-add `<ReadWith>` on non-figure surfaces
   - Don't fire `.gamebreaker` more than once per page
   - Don't substitute Inter/Roboto/SF for the five fonts
   - Don't hardcode hex outside the named intent-chip accents (`#ff6010`, `#FACC15`, `#10B981`, `#0393d6`)
7. **Magic Patterns prompt template** — for the 5 reusable surfaces (Studio entry, Overview marketing header, Player profile detail, Attribution explainer, OG image).
8. **Citation map** — for each essay primitive, name the line range in `every-lab/graph/themes/every-design-system.md` it derives from. (E.g., `<TLDR>` ↔ `every-design-system.md:46-49`; `<FourTierFeedback>` ↔ `every-design-system.md:52`.)
9. **Repo links + voice corpus pointers** — this repo (`every-court-vision`); source brand audit (`every-lab/graph/themes/every-design-system.md`); 5 annotated essays in `every-lab/graph/essays/`.

Target length: 150–250 lines. Dense, scannable, citation-rich. A new generator should be able to produce on-brand work from this single doc without reading either repo.

### 4.9 In-repo pointer — `docs/BRAND.md`

One file, one line:

```md
# Brand canon

Canonical brand reference: [`/Users/keeganmoody/every-lab/graph/meta/brand-handoff.md`](file:///Users/keeganmoody/every-lab/graph/meta/brand-handoff.md)

If you don't have access to the `every-lab` repo, ping the maintainer.
```

Plus a one-line README badge add: `Brand: see [docs/BRAND.md](docs/BRAND.md)`.

---

## 5. Brand-apply rules (apply across §4.1–4.7)

These rules are why the new pages should look like they belong:

1. **Every UI surface uses the essay vocabulary as its outer shell.** No bare `<div>` or `<Card>` for top-level page chrome. Wrap everything in `<Essay>` → `<Cover>` → `<Byline>` → `<TLDR>` → `<Lede>` → `<Figure>` → `<Pull>` → `<Section>`.
2. **Token, never hex.** Replace any inline hex with `bg-paper-tinted` / `text-confidence-direct` / `border-court-red` / etc. The intent-chip accent palette (4 hex literals only) is the lone exception, and those live in `components/IntentFilterChips.tsx` only — don't repeat them.
3. **Five fonts, no substitutions.** Fraunces (`font-serif`) for headlines and prose. Geist (`font-sans`) for UI body. Geist Mono (`font-mono`) for stats and code. Permanent Marker (`font-chalk`) for annotations. Anton (`font-gamebreaker`) for rare drama beats.
4. **Voice rules for new copy** (eyebrows, deks, TLDR bullets, Pull quotes):
   - Declarative, not promotional. Periods, not exclamations.
   - No first-person plural marketing-speak ("we're excited to ship…").
   - Pull quote is a thesis about strategy, not self-congratulation.
   - Match the cadence in `app/overview/page.tsx`'s `<Pull>` and the voice in `every-lab/graph/essays/the-folder-is-the-agent.md`.

---

## 6. Test fixtures

After your changes ship and Inngest is running locally:

| Fixture | Expected |
|---|---|
| Visit `/acquisition` | Renders with essay recipe (Cover/Byline/TLDR/Lede w/ drop-cap/Figure/Pull/Section). Five fonts visible in DevTools Network. No layout shift on filter changes. |
| Six `<BudgetTile>` instances visible | Each shows `<used> / <cap>` for its provider. Color tones match utilization. |
| `<AcquisitionTable>` shows recent jobs | Status column uses `<JobStatusBadge>`; row hover shows `.reveal-underline`; column heads in `text-eyebrow tracking-wider`. |
| Force a dead-letter (delete all provider env keys, trigger an acquisition) | `<DeadLetterView>` renders the stuck job. Click `<JobRetryButton>` → fetches `/api/acquisition/run`, button shows `Enqueueing…` then `Queued`. |
| Visit `/acquisition/jobs/<some-id>` | Renders job detail with essay shell, attempts timeline, raw activity preview. |
| Synthetic-data check | Any page that surfaces a Post (e.g., raw activity preview) still renders the existing `<SyntheticPill>` when `!post.sourceId`. Do not add a redundant indicator. |

---

## 7. Self-verification

```bash
pnpm install
pnpm exec prisma generate
pnpm typecheck
pnpm lint                                            # the runtime guardrail rule from 4a must pass
pnpm build

# Hardcoded-hex check on the new files (allow zero hits — chip accents only live in IntentFilterChips, which you're not touching)
rg "#[0-9a-fA-F]{6}" \
  components/JobStatusBadge.tsx \
  components/DeadLetterView.tsx \
  components/JobRetryButton.tsx \
  components/BudgetTile.tsx \
  app/acquisition/page.tsx \
  app/acquisition/jobs/

# Smoke
pnpm dev &
DEV_PID=$!
pnpm dev:inngest &
INNGEST_PID=$!
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/acquisition | grep -qE "^(200|307)$"; do sleep 2; done
curl -s http://localhost:3000/acquisition | grep -ciE "fraunces|essay|cover|byline|tldr"     # > 0
curl -s http://localhost:3000/acquisition | grep -ciE "stuck|dead.?letter|retry"             # > 0 (DeadLetterView present)
kill $DEV_PID $INNGEST_PID 2>/dev/null

# Brand handoff doc reachable + cites both repos
test -f /Users/keeganmoody/every-lab/graph/meta/brand-handoff.md
grep -ciE "every-court-vision|every-lab|tailwind\.config|app/overview" /Users/keeganmoody/every-lab/graph/meta/brand-handoff.md
test -f docs/BRAND.md
```

---

## 8. PR description template

```
Phase 4b: brand-applied acquisition UI + brand handoff doc

## Summary
- Restyles AcquisitionTable to use globals.css tokens + reveal-underline hover
- Adds JobStatusBadge (5 status states with confidence-tinted styling)
- Adds DeadLetterView (Figure-wrapped, with manual retry CTA)
- Adds JobRetryButton (client component, chalk-stroke animation)
- Adds BudgetTile (Server Component, per-provider daily usage)
- Wraps /acquisition and /acquisition/jobs/[id] in the Every essay recipe (Cover/Byline/TLDR/Lede/Figure/Pull/Section)
- Authors the consolidated brand handoff doc at every-lab/graph/meta/brand-handoff.md
- Adds docs/BRAND.md pointer in this repo

## Scope guardrails honored
- No Phase 4a (queue) modifications
- No Phase 3a/3b (data layer, visual layer) modifications
- All new server files export `runtime = "nodejs"` (verified by ESLint rule)
- No hardcoded hex outside the documented intent-chip accents
- Five-font discipline preserved
- Synthetic pill semantics intact

## Test plan
- [x] `pnpm typecheck && pnpm lint && pnpm build` clean
- [x] `rg "#[0-9a-fA-F]{6}"` on the new components returns 0 hits
- [x] /acquisition essay recipe verified visually
- [x] DeadLetterView retry button → Inngest event → job re-enqueued
- [x] BudgetTile colors track utilization tone
- [x] every-lab/graph/meta/brand-handoff.md exists, cites tailwind.config + app/overview, < 250 lines
- [x] docs/BRAND.md added

## Out of scope
- Live provider implementations (most adapters still return `disabled`)
- Phase 7 brand polish for the rest of the app (AppShell, CompanyHeader, GlobalFilters, PlayerCard) — separate plan
```

---

## 9. Hard rules

1. **Do not modify** Phase 4a's queue plumbing (`inngest/`, `app/api/inngest/`, `lib/acquisition/router.ts`, `lib/acquisition/cadence.ts`, `lib/acquisition/budget.ts`, `lib/acquisition/persist.ts`, the `AcquisitionJob`/`ProviderBudget` schema additions).
2. **Do not modify** Phase 3a/3b code (`lib/intent/*`, `components/HeatMapCourt.tsx`, `components/ShotPlot.tsx`, `components/AssistArc.tsx`, `components/PassingLane.tsx`, `components/IntentFilterChips.tsx`, `components/SidePanel.tsx`, `components/SyntheticPill.tsx`, the essay primitives in `components/essay/`).
3. **Do not** import `lib/db`, `lib/queries`, `lib/intent/llm`, `lib/intent/recategorize`, or `lib/acquisition/persist` from any new client component. Server Components are fine; client components must accept data as props.
4. **Do not** add hardcoded hex in any of the new files. Tokens only.
5. **Do not** substitute fonts. Five only: Fraunces, Geist, Geist Mono, Permanent Marker, Anton.
6. **Do not** add new dependencies. The repo has D3, Recharts, Framer, Radix, TanStack, Lucide. You don't need more.
7. **Do not** force-push, amend a pushed commit, or skip pre-commit hooks. Open a PR via `gh pr create`; let CI run.
8. **Do not** commit any `.env` file or any file containing real API keys.
9. **Do not** modify `every-lab/graph/themes/every-design-system.md` — read-only, you cite from it.

---

## 10. Stop conditions

- If `inngest/client.ts` doesn't exist, **stop** — Phase 4a hasn't merged yet.
- If `prisma/schema.prisma` doesn't have the `AcquisitionJob.idempotencyKey` column or `ProviderBudget` model, **stop** — Phase 4a hasn't merged.
- If `every-lab/` is unreachable on the filesystem, **stop and report** — the brand handoff doc has nowhere to live; the dev needs to confirm the path or override.
- If your `pnpm lint` fails with `surface-iq/enforce-nodejs-runtime` and you can't satisfy the rule without changing 4a code, **stop** — that's a contract violation, not a code fix.

---

## 11. After this merges

Phase 4 is done. The natural next phase is real provider implementations — fleshing out `lib/acquisition/providers/{x,github,youtube,rss,spider,parallel,manual,linkedin,instagram}.ts` so they actually return data. The acquisition UI will start showing real numbers, the dead-letter view will start showing real failures, and the budgets will start meaning something. That's a separate prompt, not yours.

---

*End of prompt. Ship clean.*
