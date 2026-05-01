# Agent Instructions — Surface IQ / every-court-vision

Project-level guidance for AI coding agents (Claude Code, Codex, Cursor, Gemini CLI). Read before doing substantive work.

## Project context

- **Surface IQ / Every Court Vision** — sales-execution lens applied to creator activity tracking, modeled on Every Inc.
- **Canonical repo:** `https://github.com/keeganmoody33/every-court-vision.git`. Never recreate or clone alongside; never push to `NEW-PROOOO` (deprecated mirror).
- **Vercel deployment:** `every-court-vision-lecturesfromog.vercel.app`. Domain `groundskeep.xyz` owned, not yet wired.
- **Stack:** Next.js (App Router) + TypeScript + Neon Postgres via `@neondatabase/serverless` + Inngest + Vercel cron. Prisma is being removed (see `docs/plans/`).

## Tooling conventions

- Package manager: **pnpm** (do not use npm/yarn).
- Node tsx scripts that import `lib/db-neon.ts` need `NODE_OPTIONS=--conditions=react-server` (the file declares `import "server-only"`). Pattern lives in `package.json` scripts.
- Smoke tests live at `lib/__tests__/*.smoke.ts` and are vanilla `node:assert` + `tsx`. They run against the real Neon DB read-only (or with idempotent UPSERTs that clean up after themselves).
- Lint: `pnpm lint`. Typecheck: `pnpm typecheck`. Both must be clean before commit.

## Subagent / persona model policy

The CE plugin (compound-engineering) ships 51 review personas. 45 of them carry `model: inherit`, which means they default to the orchestrator's model — Opus when the session runs Opus. **Override at invocation time** with the `Agent` tool's `model:` parameter rather than relying on agent frontmatter.

Default to the cheapest model that can do the job. Escalate only when a specific persona repeatedly fails on a class of finding the smaller model misses.

| Tier | Use for | CE personas |
|---|---|---|
| **Haiku** | Mechanical checks, file-existence audits, lint-style reviews, schema drift detection | `ce-coherence-reviewer` (already), `ce-schema-drift-detector`, `ce-pattern-recognition-specialist`, `ce-project-standards-reviewer`, `ce-previous-comments-reviewer` |
| **Sonnet** | Most code review, security review, performance review, doc review, research | `ce-correctness-reviewer`, `ce-maintainability-reviewer`, `ce-testing-reviewer`, `ce-security-reviewer`, `ce-performance-reviewer`, `ce-reliability-reviewer`, `ce-cli-readiness-reviewer`, `ce-api-contract-reviewer`, `ce-data-migrations-reviewer`, `ce-kieran-typescript-reviewer`, `ce-architecture-strategist`, `ce-feasibility-reviewer`, `ce-best-practices-researcher`, `ce-framework-docs-researcher`, `ce-repo-research-analyst`, `ce-issue-intelligence-analyst`, `ce-git-history-analyzer`, `ce-pr-comment-resolver` |
| **Opus** | Adversarial review on high-risk diffs, architectural decisions, planning for cross-cutting changes | `ce-adversarial-reviewer`, `ce-adversarial-document-reviewer`, `ce-product-lens-reviewer`, `ce-data-integrity-guardian`, `ce-data-migration-expert` |

**Cost-shaping rules of thumb:**

1. Prefer one Sonnet review at depth over three Opus reviews running shallow.
2. Pass `git diff` (not whole files) into reviewers; let them Read the few files they need.
3. Fan parallel reviewers out within a single 5-minute window so the prompt cache is hot for all of them.
4. Cap reviewer turns at 3–5. Unbounded turns = unbounded spend.
5. Pre-commit hooks (lint, typecheck, format) run locally — never burn agent tokens on what `eslint --fix` solves.
6. `/ultrareview` is user-triggered and billed; reserve it for pre-merge or release branches, never automatic on every push.

## Migration in progress

`feat/prisma-to-neon-serverless` is the active branch for replacing Prisma with `@neondatabase/serverless` direct. See `~/.claude/plans/memoized-soaring-narwhal.md` (or `docs/plans/2026-04-30-001-refactor-prisma-to-neon-serverless-plan.md`). Do not introduce new Prisma callsites; if you see `db.modelName.method(...)`, add it to U8 / U9 scope rather than extending the Prisma surface.

## What to avoid

- Pushing to `NEW-PROOOO` — placeholder remote that exists by accident.
- Marketplace Vercel/Neon integrations — they provision a *new* DB instead of using the existing one in `.env.local`. Use the CLI: `vercel env add DATABASE_URL preview`.
- Editing files under `~/.claude/plugins/cache/` — regenerated on plugin update.
- Bundling unrelated work into the migration branch. If it isn't migration-adjacent, branch from `main`.
