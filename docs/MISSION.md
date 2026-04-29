# Every Court Vision — Mission

_Last updated: 2026-04-29_

## North Star

The following is the canonical project description, lifted verbatim from [`TODO.md:12-21`](../TODO.md):

> Every Court Vision is a basketball analytics translation layer for growth, not a social media dashboard.
>
> The product frames Every's distributed off-platform growth like an NBA film room: posts are shots, clicks are attempts, signups are makes, paid subscriptions are threes, consulting leads are and-ones, teammate amplification is assists, and trust-building content creates gravity.
>
> The rule to preserve across product, copy, data, and demos:
>
> > This does not tell people to post more. It helps people understand what kind of growth they already create.

## The translation

| Basketball | Growth |
|---|---|
| Shot | Post (a single piece of content, on any surface) |
| Attempt | Click on the post or its link |
| Make | Signup (free) |
| Three | Paid subscription |
| And-one | Consulting lead |
| Assist | Teammate amplification (one Every employee boosting another's post) |
| Gravity | Trust-building content — pulls audience toward the brand without a direct CTA |
| Plus-minus | Net effect on adjacent posts and conversions during the same window |
| Shot quality | Confidence-weighted score combining surface, content type, archetype, and CTA |
| Box score | The 90-day stats on `/overview` (reach, engagements, clicks, signups, paid, consulting, assists, Social TS%) |
| Film room | The whole product — every route, every chart, every shot point |

## What this is

A translation layer. The data is real (or will be — see connector readiness in [`TODO.md`](../TODO.md) section 14). The framing is what makes the data interpretable to a growth team that already thinks in shots, makes, and assists rather than impressions, CTRs, and conversions.

## What this is not

- **Not a social media dashboard.** Dashboards measure activity. This measures shot quality, gravity, and assists.
- **Not a "post more" coach.** The rule is preserved literally: this does not tell people to post more. It helps them understand what kind of growth they already create.
- **Not a leaderboard.** Player cards and splits surface attribution and shot quality. They are not rankings. Comparing teammates is supported, but the product principle is that every shot is contextual: a hard CTA can miss on engagement and still score on signups; a personal post can miss direct conversion and still create trust or assists; a LinkedIn operator post can have low reach and still score on consulting intent.
- **Not a replacement for internal analytics.** `/attribution` is explicit about what's public-surface vs. authenticated vs. internal vs. modeled. Confidence badges (Direct, Estimated, Modeled, Hypothesis, Needs Internal Analytics) appear on every metric.

## Audience

**Primary:** Every's growth and sales-execution team. The translation table maps directly to revenue-attributable activity — paid subscriptions, consulting leads, teammate amplification — so the framing reads naturally for anyone whose mental model is already pipeline, attribution, and yield. Surface IQ, Trust Gravity, and Social TS% are designed to be read by someone who treats content as deal-flow precursor, not impressions.

**Secondary:** Every's editorial team, operators (Cora, Sparkle, Monologue), and writers. The shot-chart framing makes individual surface presence legible without ranking — "this is the shot you're already taking, here's how to make more of them."

## What good looks like

Three example interpretation moments the product is designed to support (lifted from [`TODO.md:165-169`](../TODO.md)):

1. **A hard CTA can miss on engagement and still score on signups.**
   The `/shot-plot` made/miss logic depends on the active scoring mode. Switching from "engagement" to "signups" can flip a post from miss to make. This is the headline insight: shot quality depends on what you're optimizing for, not on a single absolute scale.

2. **A personal post can miss direct conversion and still create trust or assists.**
   `RippleEvent` rows downstream of a "trust" archetype post show assist counts and gravity contributions even when the direct conversion column is zero. The post created the conditions for a teammate's later post to convert.

3. **A LinkedIn operator post can have low reach and still score on consulting intent.**
   The "LinkedIn Consulting Wedge" play card on `/plays` documents this pattern. Low reach + high consulting-intent comments = a high-shot-quality attempt on a small surface, not a miss.

## How the product preserves the rule

Every chart, table, and tooltip is wired to scoring modes and confidence. Nothing in the UI says "you should post X more." Surfaces are evaluated on shot quality, ripple, and assists. The only directive copy in the product is on `/plays` (e.g., "Soft CTA After Trust Post") and those are *plays* — patterns the data has surfaced — not prescriptions.

If a feature, copy block, or chart starts to read like a coach telling someone to post more, it violates the rule and should be reframed in shot-quality terms before it ships.
