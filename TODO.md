# Every Court Vision Todo

Last updated: 2026-04-27

## Status Key

- `[x]` Done in the current prototype
- `[ ]` Open
- `[~]` In progress or partially done
- `[?]` Needs product decision or real data

## Project North Star

Every Court Vision is a basketball analytics translation layer for growth, not a social media dashboard.

The product frames Every's distributed off-platform growth like an NBA film room:
posts are shots, clicks are attempts, signups are makes, paid subscriptions are threes, consulting leads are and-ones, teammate amplification is assists, and trust-building content creates gravity.

The rule to preserve across product, copy, data, and demos:

> This does not tell people to post more. It helps people understand what kind of growth they already create.

## 1. Scaffold And Design System

- [x] Scaffold Next.js App Router with TypeScript.
- [x] Add Tailwind configuration and global dark premium design tokens.
- [x] Add shadcn-style primitives: buttons, cards, badges, tabs, selects, sheets, tables, tooltips, separators, scroll areas, and popovers.
- [x] Add Framer Motion, Recharts, D3, TanStack Table, and Lucide icons.
- [x] Add path alias support through `@/*`.
- [x] Add lint, typecheck, build, and dev scripts.
- [ ] Add a short README with setup, scripts, routes, and demo flow.
- [ ] Add a lightweight architecture diagram for data flow from mock data to filtered views.

## 2. Data Model And Mock Data

- [x] Define TypeScript domain types for platforms, confidence, scoring modes, employees, accounts, posts, metrics, scores, ripple events, plays, experiments, and data sources.
- [x] Create mock data for Austin Tedesco, Dan Shipper, and Kieran Klaassen.
- [x] Create realistic mocked posts, metrics, scores, ripple events, plays, experiments, and connector readiness data.
- [x] Add future-ready Prisma schema for Postgres.
- [x] Add scoring helpers for made, missed, assisted, Social TS%, assist rate, trust gravity, and plus-minus.
- [x] Add aggregation helpers for filtering, metric sums, splits, platform cards, and zone summaries.
- [ ] Expand mock data to cover more Every teammates from the surface intelligence report.
- [ ] Add mock campaign and launch-window entities as first-class data.
- [ ] Add fixture-style data tests for scoring thresholds and aggregation math.

## 3. App Shell And Global Filters

- [x] Build persistent app shell with primary navigation.
- [x] Build NBA-style company header.
- [x] Build global filters for time window, entity, surface, scoring mode, view mode, attribution, zone mode, and color scale.
- [x] Keep filters shared across pages through top-level app state and URL search params.
- [x] Make page charts and tables recompute from filtered posts.
- [ ] Add saved filter presets for common demo views: Awareness, Trust, Consulting, Paid, and Assists.
- [ ] Add a compact mobile filter drawer for narrow screens.
- [ ] Add empty states for over-filtered views.

## 4. Overview

- [x] Build company profile header for Every.
- [x] Show mocked 90-day stats: reach, engagements, clicks, signups, paid subs, consulting leads, assisted conversions, and Social TS%.
- [x] Add platform cards for X, LinkedIn, Newsletter, Instagram, YouTube/Podcast, and GitHub.
- [x] Add overview charts for surface mix and outcome mix.
- [x] Include export placeholders.
- [ ] Add the strongest opening copy to the Overview intro: "Every Court Vision is NBA.com shot charts for Every's off-platform growth."
- [ ] Add a concise "volume, efficiency, value, and shot quality are different" note to support the basketball analytics framing.
- [ ] Tune hero/header copy for an Austin demo.

## 5. Court Heat

- [x] Build interactive court-like surface map.
- [x] Support basic zones and advanced zones.
- [x] Support scoring modes for awareness, engagement, trust, clicks, signups, paid, consulting, revenue, and assists.
- [x] Support traditional and extended color scales.
- [x] Add clickable/hoverable zone behavior with confidence badges and summaries.
- [ ] Add a legend explaining extended colors: blue awareness, purple trust/assist, orange conversion, red revenue/consulting, gray insufficient data.
- [ ] Add comparison mode for two scoring modes side by side.
- [ ] Add "insufficient data" handling by zone when future connectors are not ready.

## 6. Shot Plot And Side Panel

- [x] Render individual posts as court points.
- [x] Encode made shots, misses, assists, reach, and assisted conversion glow.
- [x] Make made/miss logic depend on selected scoring mode.
- [x] Add hover tooltips with post text, author, surface, content type, metrics, scores, and confidence.
- [x] Open side panel from clicked shot.
- [x] Show post details, classification, ripple path, conversion path, scores, confidence, and recommended play in the side panel.
- [ ] Add keyboard navigation for shot points.
- [ ] Add URL-deep-linkable selected post state.
- [ ] Add side-panel export placeholder for a single post film clip.

## 7. Player Cards

- [x] Build player cards for Austin Tedesco, Dan Shipper, and Kieran Klaassen.
- [x] Include role, archetype, primary surface, secondary surface, signature move, opportunity, Surface IQ, Trust Gravity, Social TS%, best shot, and best assist.
- [x] Add player profile view components with shot distribution and stats.
- [x] Add Export Player Card placeholder.
- [ ] Add Austin-specific demo copy: "Head of Growth film room" and "newsletter conversion bridge."
- [ ] Add teammate comparison view without implying a leaderboard.
- [ ] Add more players after expanding mock data.

## 8. Splits

- [x] Build NBA-style splits table with TanStack Table.
- [x] Add Traditional and Advanced tabs.
- [x] Support splits by platform, employee, archetype, content type, CTA type, brand touch, product, campaign, launch window, time of day, and day of week.
- [x] Include export CSV placeholder.
- [ ] Add sortable columns.
- [ ] Add sticky first column and denser desktop table controls.
- [ ] Add benchmark deltas for engagement, signup, paid, consulting, and assist rates.

## 9. Stream And Ripple Replay

- [x] Build stream timeline for ripple events.
- [x] Include filters for all events, conversions, teammate assists, external amplification, high-intent replies, known prospects, and revenue events.
- [x] Build ripple graph visualization from root post to downstream events.
- [x] Include actor, platform, event type, timestamp, value, and confidence on nodes.
- [ ] Add replay controls: play, pause, scrubber, speed, and event focus.
- [ ] Add attribution model switching inside replay.
- [ ] Add path comparison for multiple ripple chains.

## 10. Plays And Attribution

- [x] Build play cards for Soft CTA After Trust Post, Teammate Alley-Oop, LinkedIn Consulting Wedge, Human Halo, Launch Rotation, Newsletter Conversion Bridge, and GitHub-to-LinkedIn Technical Proof.
- [x] Include best for, platforms, structure, why it works, historical signal, and next experiment.
- [x] Build attribution page explaining public surface data, authenticated platform data, internal analytics, and modeled intelligence.
- [x] Add connector readiness cards for X, LinkedIn, GitHub, Instagram, newsletter platform, Stripe, CRM, web analytics, and UTM shortener.
- [x] Add confidence badges: Direct, Estimated, Modeled, Hypothesis, and Needs Internal Analytics.
- [ ] Add experiment backlog statuses: proposed, running, completed, archived.
- [ ] Add confidence upgrade path for each connector.
- [ ] Add a demo-safe section explaining what is mocked versus what would need internal analytics.

## 11. Polish, QA, And Accessibility

- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm build`.
- [x] Verify navigation across routes.
- [x] Verify filter changes update charts and tables.
- [x] Verify Shot Plot side panel opens.
- [x] Verify Court Heat zone mode and color mode switching.
- [x] Verify Splits tab switching.
- [x] Verify player cards, play cards, and attribution connectors render.
- [x] Check desktop viewport for console warnings after Recharts fixes.
- [~] Check narrow viewport layout and header wrapping.
- [ ] Do a fresh full-browser pass after the README and copy polish.
- [ ] Add more explicit loading and empty states for all chart/table surfaces.
- [ ] Review color palette for one-note theme drift and contrast.
- [ ] Add basic accessibility pass for focus states, keyboard paths, and ARIA labels.

## 12. Export Placeholders

- [x] Add Download PDF placeholder.
- [x] Add Export CSV placeholder.
- [x] Add Export Player Card placeholder.
- [ ] Add disabled-state tooltips that explain export connectors are not implemented yet.
- [ ] Add mock export preview modal for demos.
- [ ] Add future export contracts for PDF report, CSV splits, player card image, and post film clip.

## 13. Narrative And Demo Tasks

- [ ] Create a 60-second demo script using the "NBA.com shot charts for Every's off-platform growth" framing.
- [ ] Create an Austin-specific opener focused on growth film room, not social dashboard.
- [ ] Add the one-line product definition to README and Overview.
- [ ] Create a demo path: Overview, Court Heat, Shot Plot, Players, Splits, Stream, Attribution.
- [ ] Prepare three example interpretation moments:
  - Hard CTA can miss on engagement and still score on signups.
  - Personal post can miss direct conversion and still create trust or assists.
  - LinkedIn operator post can have low reach and still score on consulting intent.
- [ ] Add a short "not a leaderboard" product principle to the README.

## 14. Future Connector Readiness

- [?] X connector: public metrics, authenticated metrics, reply graph, quote graph, profile clicks, link clicks.
- [?] LinkedIn connector/manual import: post metrics, company engagement, consulting-intent comments, profile visits.
- [?] GitHub connector: repositories, stars, forks, issues, pull requests, technical proof events.
- [?] Instagram Graph connector: reach, impressions, profile activity, story/reel metrics.
- [?] Newsletter connector: opens, clicks, signups, paid conversions, byline attribution.
- [?] Stripe connector: paid subscriptions, revenue, plan changes, cohort timing.
- [?] CRM connector: consulting leads, pipeline, opportunity value, closed revenue.
- [?] Web analytics connector: sessions, referrers, UTMs, landing pages, conversion paths.
- [?] UTM shortener: canonical campaign URLs and attribution-safe links.

## 15. Release Hygiene

- [ ] Decide whether to keep this as a prototype branch only or prepare a commit.
- [ ] Add README.
- [ ] Add screenshots or short Loom/demo recording after final polish.
- [ ] Remove or keep ignored QA artifacts intentionally.
- [ ] Stage files after final review.
- [ ] Commit with a clear message when ready.
