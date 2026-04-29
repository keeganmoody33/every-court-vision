_Last updated: 2026-04-29_

# Metrics

`lib/scoring.ts` is the source of truth for **computed** metric math. This file documents what is computed there, what is stored on the model and not computed in `lib/scoring.ts` (Surface IQ, Surface Presence), and the make/miss/assist classifier the shot-plot uses.

If a question asks "how is X calculated", point at the function in `lib/scoring.ts`. If a metric is stored but not computed there, say so — do not invent a formula.

---

## Surface Presence

**Stored, not computed in `lib/scoring.ts`.**

- Field: `Employee.surfacePresence Float @default(0)` (`prisma/schema.prisma:98`)
- Plain English: how present an Employee is across the surfaces Every cares about — combines breadth (how many surfaces) with consistency (how active on each).
- Source: populated upstream of `lib/scoring.ts` (seed/fixtures). No compute function exists in `lib/scoring.ts` as of 2026-04-29.

---

## Surface IQ

**Stored on Employee, PostScores, and Metric. Not computed in `lib/scoring.ts`.**

- Fields: `Employee.surfaceIQ` (`schema.prisma:99`), `PostScores.surfaceIQ` (`schema.prisma:233`), `Metric.surfaceIQ` (`schema.prisma:281`).
- Plain English: a 0-100 read of how well an Employee or Post matches the surface it lives on — does the content choice land where this person already wins?
- Source: populated upstream by seed/fixtures and surfaced verbatim in `mapEmployee` / `mapPost` and on `getEmployee` aggregates. No compute function exists in `lib/scoring.ts` as of 2026-04-29.
- Aggregation: `splitFromPosts()` (`lib/aggregations.ts:77-110`) averages `post.scores.surfaceIQ` across a group via `avg((post) => post.scores.surfaceIQ)`.

---

## Trust Gravity

**Computed in `lib/scoring.ts` AND stored.**

- Function: `trustGravityScore(metrics: PostMetrics)` — `lib/scoring.ts:63-67`
- Formula (verbatim):
  ```ts
  const trustSignals = metrics.profileVisits + metrics.shares * 2 + metrics.comments * 1.2 + metrics.replies;
  return Math.min(100, (trustSignals / metrics.views) * 220);
  ```
  Returns 0 when `views === 0`.
- Source columns: `PostMetrics.profileVisits`, `shares`, `comments`, `replies`, `views`.
- Stored fields: `Employee.trustGravity` (`schema.prisma:100`), `PostScores.trustGravity` (`schema.prisma:236`), `Metric.trustGravity` (`schema.prisma:284`).
- Caveat: clamped at 100. Two posts with very different shapes can both saturate.

---

## Social TS%

**Computed in `lib/scoring.ts` AND stored.**

- Function: `socialTS(metrics: PostMetrics)` — `lib/scoring.ts:46-55`
- Formula (verbatim):
  ```ts
  const businessValue =
    metrics.signups * 1.6 +
    metrics.paidSubscriptions * 6 +
    metrics.consultingLeads * 9 +
    metrics.revenue / 1800 +
    metrics.assistedConversions * 0.5;
  return Math.min(99, (businessValue / metrics.views) * 1000);
  ```
  Returns 0 when `views === 0`.
- Source columns: `PostMetrics.signups`, `paidSubscriptions`, `consultingLeads`, `revenue`, `assistedConversions`, `views`.
- Stored fields: `Employee.socialTS` (`schema.prisma:101`), `PostScores.socialTS` (`schema.prisma:234`), `Metric.socialTS` (`schema.prisma:282`).
- Caveat: clamped at 99 (intentionally, not 100 — the function never returns a perfect score). The hardcoded weights (1.6, 6, 9, 1/1800, 0.5) are the sales-execution priors baked into the prototype.

---

## Assist Rate

**Computed in `lib/scoring.ts` AND stored.**

- Function: `assistRate(metrics: PostMetrics)` — `lib/scoring.ts:57-61`
- Formula (verbatim):
  ```ts
  const conversions = metrics.signups + metrics.paidSubscriptions + metrics.consultingLeads;
  if (!conversions) return metrics.assistedConversions > 0 ? 100 : 0;
  return (metrics.assistedConversions / conversions) * 100;
  ```
- Source columns: `PostMetrics.signups`, `paidSubscriptions`, `consultingLeads`, `assistedConversions`.
- Stored fields: `PostScores.assistRate` (`schema.prisma:235`), `Metric.assistRate` (`schema.prisma:283`).
- Caveat: when there are zero direct conversions, the function returns 100 if any assisted conversions exist (asserts "this post only assists"), 0 otherwise. Watch for this edge case in charts.

---

## Plus-Minus

**Computed in `lib/scoring.ts`. Not stored.**

- Function: `plusMinus(posts: Post[])` — `lib/scoring.ts:69-73`
- Formula (verbatim):
  ```ts
  const avg = posts.reduce((sum, post) => sum + post.scores.socialTS + post.scores.assists * 0.18, 0) / posts.length;
  return Number((avg - 50).toFixed(1));
  ```
  Returns 0 when `posts.length === 0`.
- Source columns: `PostScores.socialTS`, `PostScores.assists`.
- Caveat: a per-post weighted blend, mean-centered at 50. Rounded to one decimal. There is no DB column for this — it's computed on demand from a post list.

---

## Engagement Rate

**Computed in `lib/scoring.ts`. Not stored.**

- Function: `engagementRate(metrics: PostMetrics)` — `lib/scoring.ts:4-9`
- Formula (verbatim):
  ```ts
  const engagements =
    metrics.likes + metrics.comments + metrics.replies + metrics.reposts + metrics.quotes + metrics.shares;
  return (engagements / metrics.views) * 100;
  ```
  Returns 0 when `views === 0`.
- Source columns: 6 engagement counters and `views`.

---

## scoreForMode (the make/miss numerator)

`scoreForMode(post: Post, mode: ScoringMode)` — `lib/scoring.ts:11-32` — returns the scalar used to decide make-vs-miss in shot-plot. The asymmetry matters:

| Mode | Returns |
|---|---|
| `Awareness` | `post.scores.awareness` (0-100) |
| `Engagement` | `post.scores.engagement` (0-100) |
| `Trust` | `post.scores.trust` (0-100) |
| `Clicks` | `post.scores.clicks` (0-100) |
| `Signups` | `post.metrics.signups` (raw count) |
| `Paid Subs` | `post.metrics.paidSubscriptions` (raw count) |
| `Consulting Leads` | `post.metrics.consultingLeads` (raw count) |
| `Revenue` | `post.metrics.revenue` (raw $) |
| `Assists` | `post.metrics.assistedConversions` (raw count) |

The threshold a post must clear to register as a make is in `scoringThresholds` (`lib/constants.ts:85-95`):

```
Awareness 80, Engagement 58, Trust 66, Clicks 48
Signups 8, Paid Subs 3, Consulting Leads 1, Revenue 5000, Assists 12
```

---

## Made / Missed / Assisted

The shot-plot classifier — `shotOutcome(post, mode)` (`lib/scoring.ts:34-44`):

```ts
if (mode === "Assists" && post.metrics.assistedConversions >= scoringThresholds.Assists) {
  return "assist";
}
if (post.scores.assists >= 70 && post.metrics.assistedConversions >= 8 && mode !== "Revenue") {
  return "assist";
}
return scoreForMode(post, mode) >= scoringThresholds[mode] ? "make" : "miss";
```

Notes:
- An assist takes priority over a make. A post with `scores.assists >= 70` and `metrics.assistedConversions >= 8` is rendered as an **assist** in every mode except `Revenue`.
- In `Revenue` mode, the assist short-circuit is suppressed — only direct revenue counts.
- In `Assists` mode, the threshold is the count itself (≥12), not the score.

---

## modeValue (aggregator counterpart)

`modeValue(metrics: PostMetrics, mode: ScoringMode)` — `lib/aggregations.ts:54-75` — what the **summed** metric for a group means in a given mode. Used by zone summaries and platform cards to roll a list of posts up to a single number. Note `Engagement` here returns the sum of all 6 engagement counters; `Trust` returns `profileVisits + shares*2 + comments`. Different from `scoreForMode` (which reads `PostScores`) — `modeValue` reads `PostMetrics`.

---

## Cross-cutting confidence

Every metric carries a confidence pedigree via `MetricConfidence` (`schema.prisma:30-36`): `DIRECT | ESTIMATED | MODELED | HYPOTHESIS | NEEDS_INTERNAL_ANALYTICS`. The TS labels are `"Direct" | "Estimated" | "Modeled" | "Hypothesis" | "Needs Internal Analytics"`. Filter on these when "real numbers only" is the bar — see `filters.md`.
