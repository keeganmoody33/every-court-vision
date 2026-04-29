# Codex — Feedback W1-T1: Replace "NBA stats / ESPN film room" copy

> Source: user's analysis 2026-04-28. Preserved near-verbatim with envelope added for cloud-agent autonomy.

## Envelope

| | |
|---|---|
| **Repo** | `https://github.com/keeganmoody33/every-court-vision` |
| **Branch from** | `main` |
| **Branch to create** | `fix/overview-offplatform-copy` |
| **PR target** | `main` |
| **Package manager** | `pnpm` only |

## Task

Replace the subtitle copy under "OFF-PLATFORM GROWTH IQ" on the Overview page.

**CURRENT TEXT:** "NBA stats, ESPN film room, and growth analytics cockpit."

**REPLACE WITH:** "Play-by-play on your impact players — the surfaces they leverage, their highest-intent shots, and the taste profile that separates a scorer from an assist engine."

## Allowed files

The component that renders the OFF-PLATFORM GROWTH IQ subtitle on `/overview`. Search for the exact string `"NBA stats, ESPN film room"` to locate it.

## Do not touch

Any data files, config files, other components, chart logic, or any other copy.

## Acceptance

- The new string renders on `/overview` in place of the old one.
- No layout changes.
- No other text on the page changed.

## Stop conditions

If the string appears in more than one place, or is generated dynamically from a data file rather than hardcoded in JSX, **stop and report** — do not guess.

## PR template

```
fix(copy): replace NBA/ESPN cliché with Every-voiced subtitle

Per user feedback: the "NBA stats, ESPN film room, and growth analytics cockpit"
subtitle was off-brand. Replaced with on-brand copy that maintains the
basketball metaphor without leaning on outside-publication clichés.

## Test plan
- [x] /overview renders new subtitle
- [x] no layout shift
- [x] no other copy changed
```
