# Revised 90-Day Acquisition Plan: Official APIs + Spider + Parallel

## Summary
Yes: use Spider.cloud and Parallel, but as distinct route providers. The acquisition system should prefer official APIs/public feeds first, use Parallel for discovery and cited enrichment, use Spider for public-page extraction when no API/feed exists, and fall back to manual import for protected or restricted surfaces.

Tool discovery found no local Parallel MCP tool currently installed in this Codex session, so the app should integrate Parallel through its HTTP API, while documenting optional Parallel Task MCP usage for operator research/backfills. Parallel exposes Search/Task APIs with `PARALLEL_API_KEY`, and its Task MCP can be used via a remote MCP endpoint for smaller research/enrichment tasks. Spider exposes scrape/crawl endpoints behind `SPIDER_API_KEY`. ([docs.parallel.ai](https://docs.parallel.ai/?utm_source=openai))

## Provider Strategy
- **Route 1: Native source of truth.** Use official APIs or first-party feeds where available: X user timeline, GitHub REST, YouTube Data API, RSS/Substack feed, Instagram Graph for professional accounts, LinkedIn approved/authenticated APIs. X recent search is only a 7-day recovery path, while user timelines cover older user posts. LinkedIn member read access is restricted, so personal LinkedIn should be API-authorized or manually imported. ([docs.parallel.ai](https://docs.parallel.ai/?utm_source=openai))
- **Route 2: Parallel discovery/enrichment.** Use Parallel Search/Task API to find canonical surface URLs, confirm owner/profile matches, discover public author pages, collect cited evidence, and enrich sparse surfaces. Do not treat Parallel as the primary high-volume post database when a platform API/feed exists.
- **Route 3: Spider public extraction.** Use Spider for public pages without useful APIs, such as Every author pages, personal sites, Substack/public web pages, podcast pages, and public landing pages. Do not use it to bypass logged-in/protected feeds.
- **Route 4: Manual import.** Use CSV/JSON/manual upload for LinkedIn personal posts, Instagram non-authorized accounts, private newsletter analytics, and any surface that requires account-owner export.

## Implementation Changes
- Add env/config:
  - `PARALLEL_API_KEY`
  - `SPIDER_API_KEY`
  - `X_BEARER_TOKEN`
  - `GITHUB_TOKEN`
  - `YOUTUBE_API_KEY`
  - future OAuth placeholders for LinkedIn/Instagram.
- Add Prisma models:
  - `AcquisitionRoute`: platform, provider, routeOrder, capability, requiredEnv, confidence, complianceNote.
  - `AcquisitionJob`: surface, provider, status, windowStart/windowEnd, attempts, failureCode, failureReason, counts.
  - `RawActivity`: surface, provider, externalId, permalink, publishedAt, text, rawMetrics, rawPayload, citations/basis, confidence.
  - Add `externalId`, `permalink`, `rawActivityId`, `acquiredVia`, `acquiredAt` to `Post`.
- Add acquisition modules:
  - `lib/acquisition/providers/x.ts`
  - `github.ts`
  - `youtube.ts`
  - `rss.ts`
  - `spider.ts`
  - `parallel.ts`
  - `manual.ts`
  - `router.ts`
  - `persist.ts`
- Add API routes:
  - `POST /api/acquisition/run`
  - `GET /api/acquisition/jobs/[id]`
  - `POST /api/import/activity`
- Add UI:
  - Surface Acquisition view showing employee, surface, handle, route attempted, last success, posts found, confidence, and fallback reason.
  - Empty employees should show “Awaiting acquisition” or “Manual import required,” not zeros.

## Surface Route Defaults
- **X:** X timeline → manual export → Parallel/Spider only for public URL discovery.
- **LinkedIn:** approved LinkedIn API/manual owner export → Parallel public discovery only → no protected scraping.
- **Substack/Newsletter:** RSS `/feed` → Spider public page extraction → Parallel enrichment → manual export.
- **GitHub:** GitHub REST events/commits/repos → Parallel repo discovery → manual repo list.
- **YouTube:** YouTube Data API channel/video search → Spider/Parallel discovery for missing channel IDs → manual import. YouTube `search.list` supports `channelId` and `publishedAfter`; video stats require follow-up video requests. 
- **Podcast:** RSS feed → Spider Every/podcast pages → Parallel episode discovery → manual import.
- **Instagram:** Instagram Graph/Business Discovery for professional accounts → manual export → Parallel public discovery only. Meta’s Business Discovery supports professional-account metadata/media and basic media metrics. 
- **Websites/personal sites/Every pages:** RSS/sitemap → Spider crawl/scrape → Parallel enrichment → manual URL list.

## Test Plan
- Route-policy tests verify each platform selects the correct provider order based on available env vars.
- Provider fixture tests cover X, GitHub, YouTube, RSS/Substack, Spider, Parallel, and manual import.
- Persistence tests prove `(surfaceId, externalId)` dedupes repeated imports.
- API tests verify missing credentials produce clear disabled/fallback statuses.
- Browser checks verify all 16 employees show coverage status and newly acquired activity appears in Shot Plot, Court Heat, Splits, and Players.

## Assumptions
- Finish the current Phase 1/2 PR first.
- Run Phase 3 categorization before acquisition so all incoming raw activity can be classified and mapped to court coordinates.
- Parallel is used for discovery/enrichment with citations, not as a replacement for official platform APIs.
- Spider is used only for public pages and public web extraction.
- LinkedIn personal posts require owner authorization or manual import.
