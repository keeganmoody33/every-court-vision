# 90-Day Surface Activity Acquisition Plan

## Summary
Build a compliant acquisition layer, not a one-off scraper. Current Prisma has 82 surfaces and 200 seeded posts, but coverage is uneven: 166 X posts, 27 LinkedIn posts, 3 newsletter posts, 3 podcast posts, 1 GitHub post, and 8 employees still have zero posts. The next data phase should add per-surface route policies, acquisition jobs, raw activity storage, dedupe, and route-status reporting.

Do not add this to the current Phase 1/2 PR. Finish that PR, then run Phase 3 categorization, then implement this as the refined Phase 4 acquisition pipeline.

## Route Matrix
- **X:** Route 1 = X API user timeline by user ID for the 90-day window. Route 2 = X recent search only for fresh 7-day recovery. Route 3 = public profile scrape/manual archive import if API access is unavailable. X docs distinguish 7-day recent search from user timeline access to older user posts. 
- **LinkedIn:** Route 1 = authenticated LinkedIn Posts API/member analytics only for approved/authorized member or organization access. Route 2 = manual CSV/JSON import from the profile owner. Route 3 = public URL metadata only; do not scrape logged-in/protected personal feeds. LinkedIn marks `r_member_social` as restricted and exposes member analytics through authenticated APIs. 
- **Substack/Newsletter:** Route 1 = publication RSS feed at `/feed`. Route 2 = public Substack profile/publication page scrape for metadata. Route 3 = manual export. Substack officially documents publication RSS feeds and public profile surfaces. 
- **GitHub:** Route 1 = REST API public user events for recent activity plus repo commit APIs with `author`, `since`, and `until` where repos are known. Route 2 = org/repo search for Every-related repos. Route 3 = manual repo list. GitHub events are limited, so commits by repo are needed for a real 90-day view. 
- **YouTube/Podcast:** Route 1 = YouTube Data API channel search with `channelId`, `type=video`, `publishedAfter`, then fetch video stats. Route 2 = channel/podcast RSS feeds and Every site episode pages. Route 3 = manual episode import. 
- **Instagram:** Route 1 = Instagram API business discovery/media for professional accounts when authorized. Route 2 = manual export. Route 3 = public permalink metadata only. Meta’s Business Discovery docs support professional account metadata/media and basic media metrics. 
- **Websites / Every author pages / personal sites:** Route 1 = RSS/sitemap where available. Route 2 = Spider public crawl. Route 3 = manual URL list. Spider supports scrape/crawl endpoints returning structured formats behind `SPIDER_API_KEY`. 

## Implementation Changes
- Add acquisition schema:
  - `AcquisitionRoute`, `AcquisitionJob`, `RawActivity`, and source/provenance fields on `Post`: `externalId`, `permalink`, `rawActivityId`, `acquiredVia`, `acquiredAt`.
  - Add unique dedupe on `(surfaceId, externalId)` where available.
- Add route policy config:
  - `lib/acquisition/policies.ts` maps each platform to ordered routes, required env vars, confidence level, and compliance notes.
  - `lib/acquisition/router.ts` runs Route 1, then Route 2, then Route 3, recording every failure reason.
- Add per-platform collectors:
  - X, LinkedIn manual import, Substack/RSS, GitHub, YouTube, Podcast RSS, Website/Spider, Instagram manual/API-ready.
  - All collectors return one normalized `RawActivity` shape before classification.
- Add persistence flow:
  - `persistRawActivity()` stores raw source payloads.
  - `upsertPostFromActivity()` dedupes, classifies, maps court coordinates, writes metrics/scores, and recomputes employee/surface metrics.
- Add operator UI:
  - “Surface Acquisition” table showing employee, platform, handle, selected route, last run, posts found, coverage status, confidence, and next fallback.
  - Empty-state copy becomes “Awaiting acquisition” or “Manual import required,” not zero-performance.

## Test Plan
- Unit test route selection: each platform picks the correct Route 1/2/3 based on env availability and surface metadata.
- Unit test idempotency: same external post imported twice updates, not duplicates.
- Fixture tests:
  - X timeline fixture returns posts until `publishedAt < now - 90 days`.
  - Substack RSS fixture maps entries to posts.
  - GitHub commits/events fixture maps activity into technical-proof posts.
  - LinkedIn manual import fixture validates profile URL, post text, dates, and metrics.
- API tests:
  - Missing credentials returns route-specific disabled status, not a crash.
  - Manual import inserts posts and marks confidence appropriately.
- Browser checks:
  - All 16 players show acquisition status.
  - Shot Plot and Court Heat update after imported activity.
  - The 8 empty employees show awaiting-acquisition states.

## Assumptions
- Compliance-first: no credential sharing, no bypassing login walls, no protected LinkedIn scraping.
- More than 200 posts is the expected outcome, but the target is complete 90-day coverage by surface, not an arbitrary post count.
- LinkedIn personal activity requires owner auth, approved API access, or manual import.
- Keegan’s LinkedIn URL can be used as a manual-import test fixture, but it should not be added to the Every roster unless explicitly requested.
