# Codex — Feedback W1-T5: Platform Mix all-surfaces audit

> Source: user's analysis 2026-04-28. Preserved near-verbatim with envelope added for cloud-agent autonomy.

## Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Branch from** | `main` |
| **Branch to create** | `fix/overview-platform-mix-all-surfaces` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only |

## Task

The Platform Mix section on `/overview` shows surfaces (X, LinkedIn, GitHub, Instagram, Newsletter, YouTube, Podcast). Verify that **ALL** surfaces configured in the app appear in this list — including any that have 0 posts. If any configured surface is missing from the Platform Mix render list, add it with zeroed stats.

**STEP 1:** Find where the platform list is defined (likely a config array or enum — check `lib/types.ts`, `lib/constants.ts`, or `prisma/schema.prisma`).

**STEP 2:** Find where Platform Mix renders its surface rows.

**STEP 3:** If any surface in the config is absent from the render list, add it.

If all surfaces are already present, **make no changes and report that in the PR**.

## Allowed files

Platform Mix component + platform config/constants file only.

## Do not touch

Data fetching logic, chart components, other sections.

## Acceptance

- Platform Mix renders a row for every surface in the platform config, including zero-activity ones.
- No surfaces are silently omitted.
- If no changes were needed, PR description states that explicitly.

## Stop conditions

If surfaces are dynamically fetched from an API (not a static config), **stop and report** — this becomes a backend ticket, not a frontend one.

## PR template

```
fix(data-ux): Platform Mix renders all configured surfaces

Per user feedback: the Platform Mix section was silently omitting
surfaces with zero activity. Verified the render path uses the full
platform config; added any missing surfaces with zeroed stats.

(Or, if no changes were needed:)
No changes — every surface in the platform config already renders. PR
documents the verification path for future audit.

## Test plan
- [x] every Platform enum value renders a row
- [x] zero-activity surfaces show 0 instead of being absent
```
