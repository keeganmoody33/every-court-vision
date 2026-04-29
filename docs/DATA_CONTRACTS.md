# Data Contracts

**Single source of truth for every measured quantity in Court Vision.** Every metric, formula, attribution rule, and confidence statement on the dashboard ladders to this document. If a number you see in the UI doesn't match a contract here, the contract wins — fix the UI.

**Why this exists.** Phase 3b shipped a working visualization layer on top of seeded data. Real data lands in Phase 4B+. The contracts below define what each metric *means* before any pipeline writes to it, so the ingestion code, the queries, the formatters, and the tooltips all agree.

**Status.** Three contracts are LOCKED (authored 2026-04-28). Six remain SOLO TO-DO — define each before the corresponding Phase 4B work touches it.

**Source provenance.** The three locked contracts come from a chat-paste analysis on 2026-04-28; preserved verbatim where the wording was already decisive.

---

## LOCKED contracts (authoritative)

### 1. Made Shot vs Attempt

A **shot attempt** is any post with an explicit conversion CTA (signup, demo, trial, subscribe, purchase).

A **made shot** is an attempt that generated a measurable conversion event within the attribution window, credited to the first-click post in the chain.

**Implications:**
- Posts without a CTA (philosophy threads, pure observation, retweets without commentary) are **passes**, never attempts. They don't count toward the denominator of FG%, 3P%, or Social TS%.
- The first-click post in a multi-touch chain gets the made-shot credit. Earlier posts that influenced the click get assists (see contract #5 once locked).

**Affected files:** `lib/intent/classify.ts` (CTA-bearing → `attempt` flag), `lib/intent/outcome.ts` (attribution window join → `made` outcome).

---

### 2. Awareness

**Awareness is the count of unique individuals who saw the content.**

- Use **raw platform impressions** when available:
  - YouTube: `viewCount`
  - X (Twitter API v2): `public_metrics.impression_count`
  - Substack/beehiiv: `delivery_count`
  - LinkedIn: `impressionCount` (if granted via API)
- Estimate as `followers × organic_reach_rate` when raw impressions are unavailable.
- **Every awareness figure must be labeled `"measured"` or `"estimated"`** — never mix the two without labeling.

**Implications:**
- The UI tooltip on any awareness number shows the source ("from X API" vs "estimated at 30% organic reach").
- Aggregate awareness across mixed sources requires a sum-of-measured + sum-of-estimated breakdown, not a single number.

**Affected files:** `lib/intent/metrics.ts` (awareness aggregator), `lib/queries.ts` (per-post `awareness` field with source label), `components/MetricCard.tsx` (tooltip).

---

### 3. Social TS%

```
Social TS% = Total Conversions / Total Shot Attempts
```

Where:
- **Conversions** = signup + trial + demo + purchase events within the attribution window (default: 72 hours after the post).
- **Shot Attempts** = CTA-bearing posts only. Passes excluded (per contract #1).

**Window:** 72 hours, post-publish.

**Why this matters and what was wrong before:**
- A previous header value of **61.8%** was inflated because the denominator counted every post (including non-CTA posts) as an attempt.
- A previous platform-level value of **2.3%** for X was correct in numerator but used a 24-hour window instead of 72.
- Both are now consistent: same formula, same window, same definition of attempt.

**Implications:**
- Header Social TS% will land in the **8-15% range** for cross-platform aggregate (realistic). X may stay around 2-5% (lower-engagement platform).
- This is volume-adjusted efficiency. Analogous to TS% in basketball: a high TS% means you converted often per attempt, not just that you scored a lot.

**Affected files:** `lib/intent/metrics.ts` (`computeSocialTS()`), `lib/glossary.ts` (post-T6 — tooltip definition), `components/CompanyHeader.tsx` and `components/PlatformCard.tsx` (rendering).

---

## SOLO TO-DO contracts (define before the Phase 4B work that depends on them)

### 4. Zone asymmetry — left wing vs right wing

**Question:** Does left/right wing matter behaviorally in our content metaphor, or is the asymmetry incidental?

**Pick one:**
- **Asymmetric (intentional):** Document the rule — e.g. "right wing = launch rotation; left wing = soft-CT after trust post." Then `lib/intent/zones.ts` keeps `leftWing` and `rightWing` distinct, and the classifier maps based on signals.
- **Symmetric (collapse):** Merge `leftWing + rightWing → wing`. Cleaner mental model. Update `lib/intent/zones.ts`, `components/HeatMapCourt.tsx`, `lib/glossary.ts`.

**Affects:** `lib/intent/zones.ts`, `lib/intent/courtMapping.ts`, `lib/intent/classify.ts`, every chart that shows a wing zone.

**Owner:** SOLO. ~30min.

---

### 5. Attribution model — surface activity vs direct vs paid vs consulting

**Question:** How does revenue/conversion credit flow when multiple posts contributed?

**Define a 5-step credit chain:**
1. Which event types belong to which attribution category?
2. How is multi-touch credit split? (Last-click? First-click? Linear? Position-based?)
3. What's the lookback window per category? (Default = 72h from contract #3, but `consulting` may need 30 days.)
4. How is the assist credited if the converting post is on a different platform than the assisting post?
5. What disqualifies attribution? (Self-clicks, bot traffic, internal-team clicks?)

**Affects:** `prisma/schema.prisma` (new `ConversionEvent` + `PostAttribution` join in Phase 4C), `lib/attribution/*` (new module).

**Owner:** SOLO. ~1hr — this is the entire business logic layer.

---

### 6. Surface Presence score (currently shown as "78")

**Question:** Out of what? Compared to what baseline?

**Pick one:**
- **Simple ratio:** `presence = (active_platforms / total_platforms) × 100`. 78 = 5.5/7 active. Easy to explain.
- **Engagement-weighted:** `presence = sum(awareness_per_platform / median_awareness_for_role) / platforms`. Harder to explain but truer.
- **Cadence-weighted:** `presence = posts_last_30_days / expected_posts_for_role`. Punishes inactivity.

**Affects:** `lib/intent/metrics.ts` (`computeSurfacePresence()`), every Player card.

**Owner:** SOLO. ~30min.

---

### 7. Confidence Interval standard

**Question:** What CI level (95% or 99%) and what's the underlying model?

**Pick:**
- **CI level:** 95% is industry standard. 99% is tighter but bigger error bars.
- **Model:** Binomial proportion CI for percentage stats (FG%, 3P%, Social TS%). Bootstrap for medians. Wilson score for low-volume rates.

**Affects:** `lib/intent/metrics.ts` (CI computation), every numeric tile that should display ± bounds.

**Owner:** SOLO. ~30min — pick the level and the model, document. Implementation lives in Phase 4B/4C ingestion.

---

### 8. Player card data sources — real-time vs scraped

**Question:** Per-field freshness SLA. Cost vs latency vs staleness trade-off.

**Per-field decision matrix to fill in:**

| Field | Source | Freshness SLA |
|---|---|---|
| Name, role, archetype | DB (`Employee`) | real-time |
| Verified handles | DB (`Surface`) | real-time |
| Awareness 90d | aggregate from `Post.metrics.reach` | ?? (15min cron or per-request?) |
| Social TS% | computed on-demand from `Post` rows | ?? |
| "Known For" tag | derived from data pattern | ?? (per-request? cron-stale-by-24h?) |
| Latest post timestamp | `Post.timestamp` | real-time |
| Best assist | curated `lib/curated-highlights.ts` | manual update |
| Best shot | curated `lib/curated-highlights.ts` | manual update |

**Affects:** `lib/queries.ts`, caching strategy, possibly a lightweight materialized-view layer in Postgres.

**Owner:** SOLO. ~30min.

---

### 9. Assist credit rules — multi-touch splits

**Question:** When Post A leads to Post B leads to a conversion, who gets credit?

**Define:**
- Time-decay function: assist credit decays linearly over 24h? Exponentially?
- Cap: max N assists per converting shot (default 3)?
- Same-platform vs cross-platform: do cross-platform assists get more or less credit?
- Same-author vs other-author: does retweeting yourself create an assist?

**Default (working assumption until you override):** linear decay over 24h, max 3 assists per shot, cross-platform = same weight, same-author = no assist credit (it's just promotion).

**Affects:** `lib/attribution/assists.ts` (new), `Post.metrics.assistedConversions`, `RippleEvent` graph.

**Owner:** SOLO. ~30min.

---

## How to use this document

- **Before writing any ingestion or attribution code:** confirm the contract you're implementing exists in this file. If it's marked SOLO TO-DO, define it first (~30min) — never invent the rule in code.
- **Before tooltipping a number in the UI:** the tooltip text comes from this file (or `lib/glossary.ts` once it's wired). Don't write inline definitions.
- **Before changing a contract:** edit this file FIRST. The change ripples to ingestion, queries, formatters, tooltips, and tests. The contract is upstream of the code.

---

*Last updated: 2026-04-28. 3 contracts LOCKED, 6 SOLO TO-DO.*
