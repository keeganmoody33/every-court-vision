# Codex — Feedback W1-T4: Make Fig. 01 metric tiles indicate clickability

> Source: user's analysis 2026-04-28. Preserved near-verbatim with envelope added for cloud-agent autonomy.

## Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Branch from** | `main` |
| **Branch to create** | `fix/overview-fig01-clickable-affordance` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only |

## Task

The six metric tiles in **Figure 1** (REACH, CLICKS, SIGNUPS, PAID SUBS, CONSULTING, REVENUE) on `/overview` should communicate to the user that they are interactive / clickable. Right now they have no affordance.

**DO:**
- Add `cursor-pointer`
- Add a subtle hover state (border highlight or background lift — match the existing design system's hover pattern from other interactive cards; reuse `.reveal-underline` utility if it exists)
- Add an `onClick` handler **stub** that `console.log`s the metric key (e.g. `"PAID SUBS clicked"`)

**The stub is intentional** — the drilldown UI is a separate ticket.

**DO NOT** implement any modal, drawer, or data fetch. Stub only.

## Allowed files

The Fig 01 component and any shared card/tile component it uses (likely `components/MetricCard.tsx`, `components/OverviewFigures.tsx`, or similar).

## Do not touch

Data files, other figures, chart components, navigation.

## Acceptance

- Each of the 6 tiles shows `cursor-pointer` on hover and a visible hover state that matches the design system.
- `console.log` fires on click with a stable identifier per tile.
- No other behavior changes.

## Stop conditions

If the tiles are not clickable because they're rendered inside an SVG or canvas layer (not DOM), **stop and report** — do not attempt to convert the rendering approach.

## PR template

```
fix(ux): add hover + click affordance to Overview Fig 01 tiles

Per user feedback: the 6 metric tiles in Figure 1 lacked affordance for
interactivity. Added cursor-pointer + hover state + onClick stub so the
upcoming drilldown ticket (separate PR) can wire real behavior.

## Test plan
- [x] hover each tile → cursor changes, visible hover state
- [x] click each tile → console.log fires with metric key
- [x] no other tile behavior changed
```
