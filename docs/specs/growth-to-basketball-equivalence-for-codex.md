# Growth-to-Basketball Equivalence for Codex

Use this file to help Codex translate GTM, social, and content events into basketball-style event logic.

## Purpose
This is not an official basketball standard. It is a custom analogy layer for product logic, UI copy, scoring, and story generation.

The goal is to let the application treat go-to-market activity like a basketball possession:
- some actions create space
- some actions move the ball
- some actions are shot attempts
- some actions convert points
- some actions extend the possession
- some actions waste the possession

## Core analogy
Think in this structure:
1. Campaign or funnel stage = game context
2. Session or interaction sequence = possession
3. Content item or outbound message = play call
4. Social or app action = event
5. Conversion target = basket
6. Revenue impact = points

## Main equivalence table

| GTM / social action | Basketball equivalent | Why |
|---|---|---|
| Impression / view | Touch or catch | The possession has started but no scoring pressure yet. |
| Profile visit / landing-page visit | Front-court entry | The ball crossed half court; now the possession is live. |
| Product mention without CTA | Swing pass | It moves attention but does not force a shot. |
| Tweet / post with opinion only | Dribble probe | Creator is testing the defense and reading response. |
| Tweet mentioning a product | Entry pass | The brand or product has entered the action. |
| Tweet with CTA | Shot attempt | It asks for an outcome now: click, signup, reply, demo, buy. |
| CTA click | Shot on target | The attempt created real scoring pressure. |
| Signup / lead form submit | Made field goal | The possession converted into a meaningful result. |
| Purchase / booked revenue | Made 3-pointer or and-one | High-value scoring event. |
| Retweet / repost | Assist or secondary assist depending on chain | It creates distribution for another scoring chance. |
| Comment | Live-ball passback or reset | It keeps the possession alive and can create another angle. |
| Comment with product praise | Potential assist | It improves the chance that a later CTA converts. |
| Share to DM / private forward | High-value assist | Usually lower volume but stronger intent. |
| Save / bookmark | Offensive rebound | The possession survives and may convert later. |
| Follow | Offensive rebound plus reset | Future possessions become easier because the audience is retained. |
| Email capture | Made layup | Strong close-range conversion. |
| Demo request | Made shot in the paint | High intent and near-revenue. |
| Trial start | Made field goal | Clear conversion, but not final revenue yet. |
| Qualified opportunity | Made 3-pointer | Bigger expected value than a basic lead. |
| Unfollow / bounce | Turnover | Possession ended with no value. |
| Negative reply | Blocked shot or turnover forced | The attempt was stopped by the defense. |
| Ignored CTA | Missed shot | Good attempt, no conversion. |
| Duplicate spammy post | Bad shot | Low-quality attempt that hurts efficiency. |
| Wrong audience impression | Empty possession | Activity happened but with no realistic scoring chance. |

## Default event rules

### What counts as a shot attempt
Treat an action as a shot when it directly asks the audience to do something now.

Typical shot attempts:
- tweet with CTA
- post with CTA
- email with CTA
- landing page with signup button as primary intent
- outbound message asking for a meeting
- product page session that ends in a click toward conversion

### What counts as an assist
Treat an action as an assist when it materially creates or improves a later conversion event but is not itself the conversion.

Typical assists:
- retweet that drives qualified traffic
- creator mention that leads to a signup later
- teammate comment that clarifies the offer
- comparison post that drives demo requests
- testimonial clip that lifts conversion on the next CTA

### What counts as a rebound
Treat an action as a rebound when a failed conversion attempt keeps the prospect in the system.

Typical rebounds:
- save/bookmark after no immediate signup
- return visit within attribution window
- email subscribe after no purchase
- product revisit after abandoned checkout

### What counts as a turnover
Treat an action as a turnover when the sequence ends with lost attention or active damage.

Typical turnovers:
- bounce after click
- unsubscribe
- negative feedback with exit
- posting wrong CTA to wrong persona
- broken link on a CTA post

## Combination logic

### Example 1: simple shot
- Product tweet with CTA
- User clicks
- User signs up

Map this to:
- tweet with CTA = shot attempt
- click = shot on target
- signup = made field goal

### Example 2: assisted make
- Founder posts product mention
- Customer retweets
- Prospect clicks CTA from retweet chain
- Prospect books demo

Map this to:
- founder post = entry pass
- retweet = assist
- click = shot on target
- booked demo = made shot

### Example 3: miss plus offensive rebound
- Post with CTA
- User clicks
- No signup
- User bookmarks
- Returns later and starts trial

Map this to:
- original CTA = shot attempt
- no signup = missed shot
- bookmark = offensive rebound
- return visit = reset possession
- trial start = made field goal on second-chance points

### Example 4: beautiful ball movement
- Educational post
- Comment thread with clarification
- Customer quote-tweet
- Landing-page click
- Signup

Map this to:
- educational post = probe / setup
- comment clarification = extra pass
- quote-tweet = assist
- click = shot attempt on target
- signup = made shot

## Equivalence ladder
Use these as defaults.

### Possession ladder
- Impression = possession start signal
- Qualified visit = live possession
- Product touch = front-court action
- CTA = shot attempt
- Click = shot on target
- Lead = made 2-pointer
- Demo / trial = made 3-pointer
- Revenue = and-one or high-value make

### Creation ladder
- Mention = touch
- Clarifying comment = pass
- Retweet = assist chance
- Retweet that leads to click = assist
- Retweet that leads to revenue = high-value assist

### Recovery ladder
- No conversion but save = offensive rebound
- No conversion but follow = team rebound with reset
- Re-engagement email opened later = second-chance possession

## How Codex should classify ambiguous actions
When an action could fit multiple categories, classify it by primary intent.

Rules:
- If the action asks for conversion now, classify as shot attempt.
- If the action mainly moves attention to another asset, classify as pass.
- If the action preserves future opportunity after a miss, classify as rebound.
- If the action ends the sequence negatively, classify as turnover.
- If the action directly creates a later conversion for someone else, classify as assist.

## Scoring weights for product logic
You can assign weights like this:
- Impression = 0
- Visit = 0.25
- Product mention = 0.5
- Retweet / share = 0.75
- Qualified click = 1 shot on target
- Lead = 2 points
- Trial / demo = 3 points
- Qualified opportunity = 4 points
- Revenue event = 5+ points depending on ACV

These weights are custom product choices, not basketball rules.

## Derived metrics for the app

### Social FG%
Social FG% = conversions / shot attempts
Use when the app wants to measure how often CTA-bearing content turns into real outcomes.

### Social eFG%
Social eFG% = weighted conversions / shot attempts
Use when not all conversions are equal, for example lead = 2 points, demo = 3 points.

### Social TS%
Social TS% = total value created / total costly attempts
Use when combining organic posts, paid clicks, and email CTAs into one efficiency metric.

### Assist rate
Assist rate = assisted conversions / total conversions
Use when measuring how often partners, customers, employees, or creators help generate outcomes.

### Rebound rate
Rebound rate = second-chance conversions / missed first attempts
Use when follow-ups, bookmarks, retargeting, and revisits matter.

### Turnover rate
Turnover rate = dead-end sessions or damaging actions / live possessions
Use when the app wants to measure wasted attention.

## Language the app can use
- “This post created space but did not take a shot.”
- “This sequence was strong ball movement but no finish.”
- “The retweet acted like an assist because it led to a qualified click.”
- “The bookmark functioned like an offensive rebound.”
- “The CTA was a low-quality shot because the audience was wrong.”
- “This campaign scored on second-chance points after an earlier miss.”

## Recommended implementation schema
```json
{
  "event_id": "string",
  "session_id": "string",
  "actor_id": "string",
  "account_id": "string",
  "channel": "x",
  "event_type": "tweet_with_cta",
  "intent_class": "shot_attempt",
  "assisted_by": ["user_2"],
  "target_product_id": "prod_1",
  "visitor_quality": "qualified",
  "outcome": "trial_start",
  "value_points": 3,
  "possession_state": "live",
  "sequence_index": 4,
  "timestamp": "2026-04-27T14:20:00Z"
}
```

## Prompt block for Codex
```text
You are translating GTM and social events into basketball logic for a product analytics app.

Use these defaults:
- Impression/view = touch, not a shot.
- Visit = front-court possession.
- Product mention without CTA = pass or setup action.
- Tweet/post with CTA = shot attempt.
- Qualified click = shot on target.
- Lead/signup = made field goal.
- Demo/trial = higher-value made shot.
- Revenue = highest-value make.
- Retweet/share that causes later conversion = assist.
- Bookmark/save/follow after a miss = offensive rebound.
- Bounce/unsubscribe/broken CTA/wrong audience = turnover.

Interpret by primary intent:
- asks for action now -> shot
- moves attention -> pass
- preserves future chance -> rebound
- ends sequence badly -> turnover
- creates teammate conversion -> assist

Do not force every action into a shot model. Some sequences are setup possessions with no attempt.

Explain outputs in plain language and identify whether the sequence was setup, shot creation, assisted scoring, second-chance scoring, or turnover.
```

## Product design suggestion
Use two parallel layers in the UI:
1. Basketball metaphor layer for storytelling
2. Literal funnel analytics layer for auditability

Never let the metaphor hide the real event definitions.
