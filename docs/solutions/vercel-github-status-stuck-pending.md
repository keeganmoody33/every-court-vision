---
title: "vercel: GitHub status stays pending after READY deploy"
type: incident
status: draft
date: 2026-04-30
related:
  - "PR #23: feat/prisma-to-neon-serverless"
---

## Symptom

- Vercel Preview deploy completes successfully (`READY` in Vercel).
- GitHub PR status context `Vercel` remains `pending` (“Vercel is deploying your app”) indefinitely, blocking merges.

## Evidence (example from this repo)

- GitHub commit status stayed pending for the `Vercel` context even after Vercel reported the deployment as `READY`.
- Example commit: `f64797b55f31a3b7022f7caeba489ac1de0a3a18`
- Example Vercel deployment (stuck status target): `dpl_5wgYB57ZFfTL6WFwCzU9GwEVW2Mv` (state `READY`)
- Follow-up commit produced a new deployment that also reached `READY` but the GitHub `Vercel` status still remained pending:
  - Commit: `0fdca77f678024d01f0241b6ddaab3e3415a03bf`
  - Deployment: `dpl_B7y5Ejgs5WcL8cT4fc5KkjzK48Wk` (state `READY`)

## Root cause

This is not a build failure or env-var issue once the deployment is `READY`. It’s a **Vercel ↔ GitHub status synchronization problem** (the Vercel GitHub App created the pending status but never posted the terminal success/failure update back to GitHub).

## Fix / Mitigation

1. **Confirm it’s really a sync issue (not a hidden build failure)**
   - Verify the deployment state is `READY` in Vercel (via dashboard or `vercel inspect <deployment-url>`).
   - Verify build logs show successful completion.

2. **Trigger one fresh Git-backed deploy**
   - Create an empty commit and push to the PR branch to force Vercel to create a new deployment and (hopefully) post a new status update.
   - If the new deployment becomes `READY` but the GitHub `Vercel` status is still `pending`, treat it as a stuck integration, not an app problem.

3. **If it’s still stuck**
   - Reconnect the Vercel ↔ GitHub integration (Vercel project settings / Git integration), or reinstall/re-authorize the Vercel GitHub App.
   - As a last resort (only if policy allows), adjust required checks to avoid being blocked by a stale `pending` context.

## Prevention

- Prefer diagnosing the *deployment state* first (READY vs ERROR) before changing env vars or code.
- If GitHub shows `pending` but Vercel shows `READY`, avoid repeated “rebuild” churn; capture evidence and fix the integration layer.

