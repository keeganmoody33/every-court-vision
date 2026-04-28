# Codex — Phase 3b: Visual Layer Rewrite (intent · platform · recency)

> **Canonical location: this file (`docs/codex/phase-3b.md`).** Cloud Codex agents read it from the working tree. A mirror lives at `~/.claude/plans/phase-3b-codex-prompt.md` for local Claude Code plan-mode sessions. If you edit one, propagate to the other; the in-repo copy wins on conflict.

---

> **You are an autonomous engineer.** This prompt is the entire briefing. You are expected to ship a mergeable PR in one pass. No partial commits, no asking for clarification. If you're stuck, follow the *Stop Conditions* at the bottom — don't guess.

---

## 0. Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Working dir** | `/Users/keeganmoody/Documents/New project` (or fresh clone in `/tmp/` — see *Local FS hang* below) |
| **Branch from** | `main` (currently `7f967c1`) |
| **Branch to create** | `phase-3b-component-redesign` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only. Never `npm`. Never `pnpm dlx`. All scripts call local binaries from `node_modules/.bin/`. |
| **Runtime** | Node 22 (Apple Silicon dev / linux/amd64 CI). Next.js 16 App Router. React 19. TS strict. |
| **Database** | Neon Postgres (Phase 3b is UI only, no DB writes — see contract below) |

**Local FS hang note.** The dev's working dir at `/Users/keeganmoody/Documents/New project` has Spotlight/Cursor file-lock issues that hang `tsc` and `prisma`. *You will not hit this.* If you're running in a fresh container or `/tmp/` clone, both run normally. If you ARE running on the host dev's machine and `pnpm typecheck` hangs at 0% CPU after 30s, do `cd /tmp && git clone https://github.com/keeganmoody33/every-court-vision && cd every-court-vision && pnpm install` and work there.

---

## 1. The mission, in one sentence

**Make `/shot-plot` and `/court-heat` look and feel like a basketball court instead of a platform map** — by rewriting two components, adding three new ones, and wrapping the pages in the existing essay vocabulary so they belong to the same publication as `/overview`.

---

## 2. The one-line rule (D10, locked)

> **Position = intent. Color = platform. Brightness = recency.**

That's the entire visual grammar. Every design decision in this PR ladders to those three sentences.

- **Position**: where on the court. Driven by `Post.intentClass` and `Post.zone` (already populated by Phase 3a's `lib/intent/courtMapping.ts`).
- **Color**: which surface produced it. Driven by `PLATFORM_COLORS` from `lib/intent/platformColors.ts`.
- **Brightness**: how recent. Driven by `recencyVisual()` from `lib/intent/recency.ts`.

If you find yourself encoding any of those three with a different signal, stop.

---

## 3. The hard contract (`PHASE3B_GUARDRAILS.md`, in-repo)

**Read [`PHASE3B_GUARDRAILS.md`](PHASE3B_GUARDRAILS.md) at repo root before writing a single line.** Treat it as law. Quoted highlights you may not violate:

- **No `prisma/schema.prisma` changes.** Period. Phase 3a locked the data shape; 3b consumes it.
- **No DB writes from UI components or routes.**
- **No imports of `lib/db`, `lib/intent/llm`, or `lib/intent/recategorize` from any component.** Components are pure renderers.
- **No new shadow classification systems.** No parallel enums for the same concept. Use what 3a shipped.
- **No business logic in components.** Classification, outcome, coord mapping, recency — all stay in `lib/intent/*`. Components only consume.

The locked post-level fields you can rely on as the single source of truth:

```
intentClass: "threePoint" | "midRange" | "paint" | "freeThrow" | "pass"
intentConfidence: number  // 0..1
outcome: "made" | "missed" | "turnover"
recovered: boolean
isAssist: boolean
platform: Platform
timestamp: string  // ISO. (UI alias for Prisma's publishedAt column — see lib/types.ts:182. The mapping happens in lib/queries.ts; do NOT rename.)
x, y: number  // 0..100, deterministic, stable
zone: string  // e.g. "threePoint.leftWing", "pass.top"
classifiedAt: string | null
classifiedBy: "keyword" | "llm" | "manual" | null
sourceId: string | null  // null OR not starting with "acquired:" → SyntheticPill renders
```

The locked `Metric` rollups (read-only):

```
totalAttempts, threePtAttempts, midAttempts, paintAttempts, ftAttempts,
passes, turnovers, threePtMade, midMade, paintMade, ftMade,
threePtPct, midPct, paintPct, fgPct, effectiveFgPct, trueShootingPct,
pacePerWeek, brandTouchEvery, brandTouchPersonal, assistsCreated
```

---

## 4. Read first (in order, before coding)

1. **[`PHASE3B_GUARDRAILS.md`](PHASE3B_GUARDRAILS.md)** — the law.
2. **[`lib/types.ts`](lib/types.ts)** — `Post`, `PostWithEmployee`, `RippleEvent`, `IntentClass`, `ShotOutcome`, `Platform`, `FilterState`. The shape you render against.
3. **[`lib/intent/zones.ts`](lib/intent/zones.ts)** — `SHOT_ZONES`, `PASS_LANES`, `OUT_OF_BOUNDS` geometry constants. These define every region you'll render. Court viewBox is `0 0 100 94`. Y=92 is the offensive basket. Already-rendered geometry lives in `components/CourtCanvas.tsx`.
4. **[`lib/intent/platformColors.ts`](lib/intent/platformColors.ts)** — `PLATFORM_COLORS: Record<Platform, string>`. Entire color palette.
5. **[`lib/intent/recency.ts`](lib/intent/recency.ts)** — `recencyVisual(timestampISO): { size: number; opacity: number }`. Already returns the right values; you just consume.
6. **[`lib/intent/courtMapping.ts`](lib/intent/courtMapping.ts)** — confirm zone constants are exported the way you expect. **Do not modify.**
7. **[`components/CourtCanvas.tsx`](components/CourtCanvas.tsx)** — the SVG shell with `<defs>` for `softGlow`. You'll add `strongGlow` for converted assists; otherwise leave alone.
8. **[`components/HeatMapCourt.tsx`](components/HeatMapCourt.tsx)** — what you're replacing. Keep the right-side selected-zone panel pattern; replace the platform-rectangle layout.
9. **[`components/ShotPlot.tsx`](components/ShotPlot.tsx)** — what you're replacing. **Preserve the button-overlay click-to-open-`SidePanel` pattern** (lines ~77–92 today). It's the only interaction; don't lose it.
10. **[`components/SidePanel.tsx`](components/SidePanel.tsx)** — already integrated with `SyntheticPill`. **Do not touch.** Just keep passing `selectedPost` to it.
11. **[`components/SyntheticPill.tsx`](components/SyntheticPill.tsx)** — already shipped. Renders when `!post.sourceId || !post.sourceId.startsWith("acquired:")`.
12. **[`components/AppShell.tsx`](components/AppShell.tsx)** — `useFilters()` lives here. URL-param sync. You're extending `FilterState` with three new keys; do it cleanly.
13. **[`app/overview/page.tsx`](app/overview/page.tsx)** — **the canonical essay recipe.** Cover → Byline → TLDR → Lede w/ drop-cap → Body → Figure → Figure → Figure → Pull → Section. `/shot-plot` and `/court-heat` pages adopt this rhythm.
14. **[`components/essay/index.ts`](components/essay/index.ts)** — the vocabulary barrel: `Cover`, `Byline`, `TLDR`, `Lede`, `Body`, `Pull`, `Figure`, `StatTile`, `FourTierFeedback`, `ReadWith`, `Section`, `Eyebrow`, `EssayTitle`, `Essay`. **All UI you write goes inside this vocabulary, not bespoke divs.**
15. **[`app/globals.css`](app/globals.css)** — token source. HSL CSS vars + `paper.*` / `halftime.*` / `court.*` / `confidence.*` palettes + `.prose-essay` / `.drop-cap` / `.chalk-stroke` / `.reveal-underline` / `.gamebreaker` utilities + keyframes.
16. **[`tailwind.config.ts`](tailwind.config.ts)** — token bindings. `font-serif` (Fraunces) / `font-sans` (Geist) / `font-mono` (Geist Mono) / `font-chalk` (Permanent Marker) / `font-gamebreaker` (Anton). Use these — never substitute Inter or Roboto.

---

## 5. Deliverables (5 components, 1 PR)

Each must compile, render, and play with the existing data on its own — not as a half-step.

### 5.1 Rewrite `components/HeatMapCourt.tsx`

**Today** (delete): groups posts by `zoneSummaries(posts, zoneMode)`, renders `basicZones`/`advancedZones` as bare rectangles colored by `heatColor(scoringMode, colorScale, value)`.

**After**: render six intent-driven heat regions over the court SVG. Heat each by post volume in that region (or by `scoringMode`'s value when selected).

Region geometry — pull straight from `SHOT_ZONES`:
| Region | Element | Source |
|---|---|---|
| 3P arc | SVG `<path>` along the existing arc, expanded to band y=58..90, x=5..95 | `SHOT_ZONES.threePoint.{leftWing, topOfKey, rightWing}` |
| Mid elbows | 3 rounded rects | `SHOT_ZONES.midRange.{leftElbow, rightElbow, topElbow}` |
| Paint | 1 rect | `SHOT_ZONES.paint` |
| FT line | 1 thin rect | `SHOT_ZONES.freeThrow` |
| Pass lanes | 3 faint dotted rects (decorative — heat lives elsewhere) | `PASS_LANES` |
| OOB rim | thin band around court edge, only colored when turnovers > 0 | `OUT_OF_BOUNDS` |

**Heat color**: `paper.tinted` to `court-orange` gradient via opacity scale (use `d3-scale.scaleLinear` with `.range([0.18, 0.92])`). For `scoringMode === "Trust"` swap to `confidence-direct`; for `Revenue` swap to `court-red`. Wire through the existing `colorScale` prop.

**Selected region panel** (right side, 320px wide on `xl:`): show intent-class metrics from `lib/intent/metrics.ts`. Use `<StatTile>` from `components/essay/Figure.tsx` for each row. Layout matches what's there today — just swap the data shape.

**Wrapping**: keep using `<Card className="border-white/10 bg-black/25">`. The page-level essay wrap is added in §5.6.

### 5.2 Rewrite `components/ShotPlot.tsx`

**Today** (delete): renders dots colored by `shotOutcome(post, scoringMode)` (red miss / teal make), sized by `scaleSqrt(metrics.reach)`. Uses `confidence-modeled` glow.

**After**: dots colored by `PLATFORM_COLORS[post.platform]`, sized + faded by `recencyVisual(post.timestamp)`.

Render order (matters for visual stacking):
1. `PassingLane` (3 of them, lanes `left`/`right`/`top`) — drawn first, behind everything.
2. Heat regions (faint outlines only, optional — courts already have geometry).
3. Posts where `intentClass !== "pass"` — circles or X-marks.
4. `AssistArc` instances — drawn on top so arcs visibly terminate at shots.
5. Click overlays — invisible buttons over each post for `setSelectedPost(post)`.

Per-post visual rules:
- **Made shot** (`outcome === "made"`): solid filled circle. `r = recencyVisual(post.timestamp).size * (post.intentClass === "threePoint" ? 1.3 : 1)`. `fill = PLATFORM_COLORS[post.platform]`. `fillOpacity = recencyVisual(post.timestamp).opacity`. Inner stroke `stroke="white" strokeOpacity={0.5}`.
- **Missed shot** (`outcome === "missed"`): X-mark in platform color, `strokeWidth=1.4`, no fill, `opacity` from recency.
- **Turnover** (`outcome === "turnover"`): X-mark at the post's `(x, y)` (already mapped to OOB by 3a) at fixed `opacity={0.4}`, color `text-paper-muted`.
- **Pass post** (`intentClass === "pass"`): not rendered as a dot — picked up by `PassingLane` instead.
- **High-converting** (`metrics.assistedConversions > 100`): wrap in `<filter url="#softGlow">` — preserve existing aura.
- **Synthetic post** (`!post.sourceId || !post.sourceId.startsWith("acquired:")`): `SidePanel` already renders the pill on click. Don't add a per-dot indicator on the chart — too noisy.

**Click-to-open `SidePanel` is non-negotiable.** Today's pattern at `components/ShotPlot.tsx:77-92` uses an absolutely-positioned `<button>` over each post for accessibility (focusable, keyboard-navigable). **Preserve this pattern exactly.** Do not collapse to `<g onClick>` — you lose keyboard nav.

### 5.3 New `components/AssistArc.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import type { Platform } from "@/lib/types";

export interface AssistArcProps {
  fromX: number;        // 0..100, the assister's post
  fromY: number;        // 0..94
  toX: number;          // 0..100, the assisted shot
  toY: number;
  fromPlatform: Platform;
  toPlatform: Platform;
  converted: boolean;   // assisted shot's outcome === "made"
  delay?: number;       // animation stagger seconds
}

export function AssistArc(props: AssistArcProps): JSX.Element { /* ... */ }
```

Rendering:
- Quadratic Bezier `<path>` from `(fromX, fromY)` to `(toX, toY)`. Control point = midpoint, offset perpendicular by `0.25 * distance`, biased toward `y=0` (curve bows away from the basket — visually reads as a pass arcing through air).
- `stroke = PLATFORM_COLORS[fromPlatform]`. `strokeWidth = converted ? 1.4 : 1`. `strokeOpacity = converted ? 1 : 0.6`. `strokeDasharray = converted ? "" : "2 1.5"` (dashed when not converted).
- `converted` adds `<filter url="#strongGlow">` (you add this filter to `CourtCanvas.tsx` defs — see §5.7).
- Wrap in `motion.path` with `initial={{ pathLength: 0, opacity: 0 }}`, `animate={{ pathLength: 1, opacity: stroke-opacity }}`, `transition={{ duration: 0.6, delay: props.delay ?? 0 }}`.
- Two end caps: `<circle cx={fromX} cy={fromY} r={0.8}>` filled with `fromPlatform` color; same for `(toX, toY)` with `toPlatform` color.
- `pointer-events-none` — arcs don't intercept clicks.

### 5.4 New `components/PassingLane.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import type { Platform } from "@/lib/types";

export interface PassingLanePost {
  id: string;
  x: number;          // 0..100
  y: number;          // 0..94
  platform: Platform;
  timestamp: string; // ISO. (Same UI field name as Post.timestamp.)
}

export interface PassingLaneProps {
  posts: PassingLanePost[];
  lane: "left" | "right" | "top";
}

export function PassingLane(props: PassingLaneProps): JSX.Element { /* ... */ }
```

Rendering:
- Sort `posts` by `timestamp` ascending.
- If `posts.length < 2`: render only individual node circles, no path.
- Else: cubic Bezier path connecting the points in order. Smooth (Catmull-Rom-ish) — use `d3-shape.line().curve(d3.curveBasis)` if it's already a dep, else hand-roll.
- Path: `stroke="rgba(255,255,255,0.35)"`, `strokeWidth=0.6`, `strokeDasharray="1.5 1"`, `fill="none"`. Lower contrast than shot dots — passes are setup, not drama.
- Each post node: small open circle, `r=1.2`, `stroke = PLATFORM_COLORS[platform]`, `strokeWidth=0.7`, `fill="none"`, `opacity` from `recencyVisual()`.
- Wrap path in `motion.path` with same `pathLength` animation as `AssistArc`.

### 5.5 New `components/IntentFilterChips.tsx`

The page-level filter strip above `/shot-plot` and `/court-heat`. Sticky-positioned. Reads/writes `useFilters()`.

**Layout** (left to right, separated by vertical hairlines `border-l border-paper-muted/20 pl-3 ml-3`):

| Group | Chips | Active style |
|---|---|---|
| Intent | `3P` · `Mid` · `Paint` · `FT` · `Pass` | filled with intent's accent: 3P=`#ff6010`, Mid=`#FACC15`, Paint=`#10B981`, FT=`#0393d6`, Pass=`paper-muted` dotted |
| Platform | 9 chips: `X`, `LinkedIn`, `GitHub`, `Substack`, `Newsletter`, `YouTube`, `Podcast`, `Instagram`, `Launches` | each chip's left edge is a 3px swatch from `PLATFORM_COLORS`. Active = filled with that color at 25% opacity, full text. |
| Outcome | `Made` · `Missed` · `Turnover` | green / red / paper-muted |
| Time | `7d` · `30d` · `90d` · `All` | filled with `paper-tinted` |

**Behavior:**
- Each chip is a `<button>` (not a Radix Toggle — keep dependencies flat). Click toggles inclusion.
- **Multi-select within a group** (selecting `3P` and `Paint` shows both). Cross-group is AND.
- Filter state on URL: `?intent=threePoint,paint&platforms=X,GitHub&outcome=made&time=30d`. Comma-separated. `time` is a single value.
- "Clear all" link at the right end resets all four groups in one click.

**Worked example skeleton** (this is your template — use for the other groups):

```tsx
"use client";

import { useFilters } from "@/components/AppShell";
import type { IntentClass } from "@/lib/types";

const INTENT_CHIPS: Array<{ value: IntentClass; label: string; accent: string }> = [
  { value: "threePoint", label: "3P", accent: "#ff6010" },
  { value: "midRange",   label: "Mid", accent: "#FACC15" },
  { value: "paint",      label: "Paint", accent: "#10B981" },
  { value: "freeThrow",  label: "FT", accent: "#0393d6" },
  { value: "pass",       label: "Pass", accent: "var(--paper-muted)" },
];

export function IntentFilterChips() {
  const { filters, setFilter } = useFilters();
  const selected = filters.intentClass ?? [];

  function toggle(value: IntentClass) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    setFilter("intentClass", next.length ? next : undefined);
  }

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-paper-muted/20 bg-paper-base/85 px-4 py-3 text-eyebrow uppercase tracking-wider backdrop-blur">
      <span className="text-paper-muted">Intent</span>
      {INTENT_CHIPS.map((chip) => {
        const active = selected.includes(chip.value);
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => toggle(chip.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
              active
                ? "border-transparent text-paper-base"
                : "border-paper-muted/30 text-paper-muted hover:border-paper-muted/60"
            }`}
            style={active ? { backgroundColor: chip.accent } : undefined}
            aria-pressed={active}
          >
            {chip.label}
          </button>
        );
      })}
      {/* Repeat the pattern for Platform, Outcome, Time groups, then a Clear All. */}
    </div>
  );
}
```

Build the other three groups in the **exact same shape** — chip arrays at the top, a `toggle()` per filter key, JSX matches.

### 5.6 Wire pages with the essay recipe

**`app/shot-plot/page.tsx`** and **`app/court-heat/page.tsx`** — wrap each in `<Essay>` and follow the recipe:

```tsx
import { Essay, Cover, Byline, TLDR, Lede, Body, Figure, Pull, Section } from "@/components/essay";
import { IntentFilterChips } from "@/components/IntentFilterChips";
import { ShotPlot } from "@/components/ShotPlot";
// ...server component fetches via lib/queries.ts...

export default async function ShotPlotPage() {
  const [posts, employees, plays, rippleEvents] = await Promise.all([/* ... */]);
  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const playMap = Object.fromEntries(plays.map((p) => [p.id, p]));

  return (
    <Essay>
      <Cover
        eyebrow="Shot Plot"
        title="Where every post lands on the court"
        dek="Position by intent. Color by platform. Brightness by recency."
      />
      <Byline agent="Bobbito" date={new Date().toISOString()} issue="Vol. 1" />
      <TLDR
        bullets={[
          "Each dot is one post mapped to its intent class.",
          "Color tells you which platform it ran on; brightness tells you how recent.",
          "Pass-class posts flow through three lanes; assists arc to the shot they set up.",
        ]}
      />
      <Lede>
        <Body dropCap>
          The court is the metaphor; the data is the truth. {/* ... 1-2 sentences ... */}
        </Body>
      </Lede>
      <IntentFilterChips />
      <Figure title="Fig. 01 · Court coverage" caption="200 posts across the past 90 days, plotted by Phase 3a's deterministic intent-to-coordinate mapper.">
        <ShotPlot posts={posts} employeeMap={employeeMap} playMap={playMap} rippleEvents={rippleEvents} scoringMode="Awareness" />
      </Figure>
      <Pull>Restraint is a weapon. The shape of a roster's shot chart says more about strategy than any LinkedIn post ever will.</Pull>
      <Section />
    </Essay>
  );
}
```

`/court-heat` follows the same shape with `<HeatMapCourt>` in the Figure. Different copy in `<Cover>`, `<TLDR>`, `<Lede>`, `<Pull>`. Match the voice in `app/overview/page.tsx`.

**Voice rules for the new copy** (eyebrows, deks, TLDR bullets, Pull quotes):
- Declarative, not promotional. Sentences end with periods, not exclamations.
- No first-person plural marketing-speak ("we're excited to..."). State what the page shows.
- Pull quote is a thesis — about the data or the strategy, not a self-congrat.
- Match the cadence of `app/overview/page.tsx`'s Pull quote.

### 5.7 Modify `components/CourtCanvas.tsx` (minor)

Add to the `<defs>` block — that's the only edit:

```tsx
<filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="2.4" result="blur" />
  <feMerge>
    <feMergeNode in="blur" />
    <feMergeNode in="blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

Used by `AssistArc` when `converted={true}`. Keep the existing `softGlow` filter intact.

### 5.8 Extend `FilterState` in `lib/types.ts` and `useFilters()` in `components/AppShell.tsx`

`FilterState` adds:
```ts
intentClass?: IntentClass[];
outcome?: ShotOutcome[];
platforms?: Platform[];
```

`useFilters()` URL-param sync handles all three with comma-separated encoding (e.g. `?intent=threePoint,paint`). `time` already exists as a single-select `timeWindow` — reuse, do not add a duplicate `time` key.

### 5.9 Delete dead code in `lib/constants.ts`

```ts
// Phase 3a left these stubs:
export const basicZones: never[] = [];
export const advancedZones: never[] = [];
```

Remove. Replace any consumer references in components (there shouldn't be any after §5.1) by importing directly from `@/lib/intent/zones` or `@/lib/intent/courtMapping`.

---

## 6. Test fixtures (verify against these before declaring done)

After your rewrite, the seeded DB renders these three real posts as expected. Visit `/shot-plot` with no filters and confirm:

| Author | Post text (truncated) | `intentClass` | `(x, y)` lands in | Expected color | Expected style |
|---|---|---|---|---|---|
| Austin Tedesco | "Wrote about my daily-driver agent for @every, and open-sourced the plugin" | `threePoint` | `SHOT_ZONES.threePoint.topOfKey` | `#1DA1F2` (X blue) | recent → full size + opacity |
| Dan Shipper | "The real risk of AI isn't replacement — it's autopilot" | `pass` (no CTA, philosophy) | `PASS_LANES.top` | `#1DA1F2` connector arc | flows through top pass lane, not a dot |
| Yash Poojary | "We burned nearly a billion tokens so your desktop doesn't have to look like a crime scene" | `threePoint` | `SHOT_ZONES.threePoint.topOfKey` | `#1DA1F2` | one of the most recent → bright + larger |

Plus a synthetic-data sanity check:
- A post seeded with `sourceId === null` should still plot, and clicking it opens `SidePanel` with the existing amber `SyntheticPill` visible. Don't add another indicator on the chart.

If any fixture lands wrong, your renderer is off — check that you read `post.x`, `post.y`, `post.zone` straight from the row (don't recompute) and that the platform-color dispatch covers all `Platform` enum values.

---

## 7. Self-verification (run in this order; do not skip)

```bash
# from repo root
pnpm install
pnpm typecheck                 # must pass clean
pnpm lint                      # must pass clean
pnpm build                     # must succeed

# Dead-code check — these should all return zero hits
rg "basicZones|advancedZones" --type ts --type tsx
rg "from .*lib/db" components/                       # no DB imports in components
rg "from .*lib/intent/llm" components/               # no LLM imports
rg "from .*lib/intent/recategorize" components/      # no recategorize imports
rg "#[0-9a-fA-F]{6}" components/IntentFilterChips.tsx components/AssistArc.tsx components/PassingLane.tsx
# (^ allow exactly the chip-accent hex literals listed in §5.5; everything else must be a token)

pnpm dev &
DEV_PID=$!
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/shot-plot | grep -qE "^(200|307)$"; do sleep 2; done

# Smoke
curl -s http://localhost:3000/shot-plot | grep -ciE "fraunces|essay|cover" | head
curl -s http://localhost:3000/court-heat | grep -ciE "fraunces|essay|cover" | head

# Cleanup
kill $DEV_PID 2>/dev/null
lsof -ti:3000 | xargs -r kill -9 2>/dev/null
```

If any step fails, fix and re-run from the top. Do not commit until every step passes.

---

## 8. PR description template

```
Phase 3b: visual layer — intent (position) + platform (color) + recency (brightness)

## Summary
- Rewrites HeatMapCourt: intent-class regions (3P arc, mid elbows, paint, FT line) + OOB rim
- Rewrites ShotPlot: platform-colored dots sized by recency, X-marks for missed/turnover
- Adds AssistArc: Bezier from assister to assisted shot; glows on conversion
- Adds PassingLane: dotted trajectories for `intentClass === "pass"` posts
- Adds IntentFilterChips: intent × platform × outcome × time, URL-encoded multi-select
- Wires `/shot-plot` and `/court-heat` pages into the Every essay recipe (Cover/Byline/TLDR/Lede/Figure/Pull/Section)
- Deletes deprecated `basicZones` / `advancedZones` stubs

## Scope guardrails honored
- No Prisma schema changes
- No DB writes from components or pages
- No imports of `lib/db`, `lib/intent/llm`, or `lib/intent/recategorize` in components
- All classification/coord/recency logic stays in `lib/intent/*`
- Synthetic-data pill (Phase 1.5 contract) preserved on `SidePanel`

## Test plan
- [x] `pnpm typecheck && pnpm lint && pnpm build` clean
- [x] `rg "basicZones|advancedZones"` returns 0 hits
- [x] `/shot-plot` and `/court-heat` render at 200; essay primitives visible in HTML
- [x] Three named posts (Austin/Dan/Yash) plot in their expected zones with their expected platform colors (see prompt §6)
- [x] Filter chips toggle correctly; URL params encode + restore
- [x] Click any dot/arc → SidePanel opens with synthetic pill where applicable

## Out of scope (deferred)
- Mobile responsive court (Phase 7)
- Animated transitions between scoring modes
- Hover preview on chart (click-to-open is enough)
- Image export of filtered chart (Phase 6b)
```

---

## 9. Hard rules — what you do NOT do

1. **Do not** modify `prisma/schema.prisma`, `prisma/seed.ts`, or anything in `prisma/`. Phase 3a locked the contract.
2. **Do not** import `lib/db`, `lib/intent/llm`, `lib/intent/recategorize`, `lib/intent/refineEndpoint`, or `lib/intent/recategorizeCore` from any file under `components/`. Components are pure.
3. **Do not** add new dependencies without justifying each one in the PR description. The repo already has D3, Recharts, Framer Motion, Radix, TanStack Table, Lucide. You don't need more.
4. **Do not** substitute fonts. Fraunces, Geist, Geist Mono, Permanent Marker, Anton — those five only.
5. **Do not** hardcode hex outside the chip-accent literals in §5.5. Everything else uses `paper.*` / `halftime.*` / `court.*` / `confidence.*` tokens or `PLATFORM_COLORS`.
6. **Do not** change `SidePanel.tsx` or `SyntheticPill.tsx`. They're already shipped and consumed.
7. **Do not** use `pnpm dlx`. Every script in `package.json` calls local binaries; respect that.
8. **Do not** force-push, amend a commit that's been pushed, or skip pre-commit hooks. If a hook fails, fix the root cause.
9. **Do not** open a draft PR — you ship final-quality work or you bail.

## 10. Stop conditions (when to bail)

- If `pnpm typecheck` reveals that Phase 3a's data layer doesn't actually export what this prompt says it does (e.g. `SHOT_ZONES` shape differs, `recencyVisual` signature changed), **stop**. Open the PR as draft, document the gap in the PR description, and stop. Do not invent missing exports.
- If you cannot achieve all the §6 fixture assertions without modifying `prisma/seed.ts` or `lib/intent/*`, **stop**. The visual layer is wrong if it can't render real seeded data; reaching into the data layer to "fix" it violates §3.
- If `pnpm dev` won't boot due to a Prisma client issue (Neon migration not applied, `DATABASE_URL` unset), **stop and report**. Don't paper over with mocks. The dev should set `DATABASE_URL` before you run; that's their problem, not yours.

## 11. After you ship

Phase 4 — acquisition activation — is next. The acquisition router skeleton exists; the per-provider `collect()` adapters are mostly stubs. See [the master plan](../.claude/plans/users-keeganmoody-downloads-every-extra-keen-whale.md) Section 9 (Plan A: queue migration + brand-applied UI) for the next briefing. Don't start that work in this PR.

---

*End of prompt. Ship clean.*
