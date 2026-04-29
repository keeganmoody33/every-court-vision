# Codex — Feedback W1-T3: Add "Social TS%" tooltip

> Source: user's analysis 2026-04-28. Preserved near-verbatim with envelope added for cloud-agent autonomy.

## Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Branch from** | `main` |
| **Branch to create** | `fix/social-ts-tooltip` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only |

## Task

The metric **"Social TS%"** appears in the Overview header stats section and in the Platform Mix table. Users have no idea what it means. Add an inline tooltip (info icon ⓘ) next to every instance of "Social TS%" that, on hover, displays:

> **Social True Shooting %** — `Total Conversions / Total Shot Attempts`. Conversions = signup, trial, demo, purchase events within 72h of post. Shot attempts = CTA-bearing posts only (passes excluded). Volume-adjusted efficiency, basketball-style.

(This is the canonical definition from `docs/DATA_CONTRACTS.md` §3. If `docs/DATA_CONTRACTS.md` exists in the repo, **read it first** and use its wording exactly.)

## Allowed files

The component(s) rendering the Social TS% label. Search for `"Social TS%"` or `socialTS` / `socialTs` to locate all instances. Reuse whatever tooltip primitive already exists in the codebase (likely `@radix-ui/react-tooltip`). If none exists, use a plain HTML `title` attribute as a fallback.

## Do not touch

Data files, chart logic, any other metric labels, layout files.

## Acceptance

- Hovering the ⓘ icon (or the label itself if using `title` attr) next to "Social TS%" shows the definition.
- All instances on the page are updated consistently — no orphaned labels.

## Stop conditions

If Social TS% is computed dynamically and the formula in source diverges from `docs/DATA_CONTRACTS.md`, **stop and report** — note the discrepancy in the PR description; do not silently overwrite either side.

## PR template

```
fix(ux): add Social TS% tooltip with formal definition

Per user feedback + docs/DATA_CONTRACTS.md §3: define Social TS% inline
on hover so users understand the metric they're seeing. Definition matches
the locked contract.

## Test plan
- [x] hover shows definition on Overview header
- [x] hover shows definition on Platform Mix table rows
- [x] consistent across all instances
```
