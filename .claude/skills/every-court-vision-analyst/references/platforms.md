_Last updated: 2026-04-29_

# Platforms

The `Platform` enum in `prisma/schema.prisma:9-28` has **18 values**. The TS-side string union in `lib/types.ts:1-19` re-spells them with display casing. The mapping is `platformFromDb` at `lib/queries.ts:39-58`.

**Three different "core" sets exist in the repo. Don't conflate them.**

---

## The 18-value `Platform` enum (canonical)

`prisma/schema.prisma:9-28`, in source order:

```
X
LINKEDIN
GITHUB
INSTAGRAM
NEWSLETTER
YOUTUBE
PODCAST
LAUNCHES
TEAMMATE_AMPLIFICATION
EXTERNAL_AMPLIFICATION
PRODUCT_HUNT
PERSONAL_SITE
TIKTOK
WEBSITE
SUBSTACK
APP_STORE
REFERRAL
CONSULTING
```

The TS union (`lib/types.ts:1-19`) spells them: `"X"`, `"LinkedIn"`, `"GitHub"`, `"Instagram"`, `"Newsletter"`, `"YouTube"`, `"Podcast"`, `"Launches"`, `"Teammate Amplification"`, `"External Amplification"`, `"Product Hunt"`, `"Personal Site"`, `"TikTok"`, `"Website"`, `"Substack"`, `"App Store"`, `"Referral"`, `"Consulting"`.

---

## The three "core" sets

Different parts of the app slice this enum differently. Pick the right set for your question:

### `platforms` — the 10 navigation surfaces

`lib/constants.ts:13-24` — used by global filters and zone widgets. The 7 first-class surfaces plus three meta-surfaces (`Launches`, `Teammate Amplification`, `External Amplification`).

```
X, LinkedIn, GitHub, Instagram, Newsletter, YouTube, Podcast,
Launches, Teammate Amplification, External Amplification
```

### `coreSurfaces` — the 7 platforms `platformCards()` renders

`lib/constants.ts:26-34` — the surface cards on `/overview`. **Excludes** Substack, Launches, the amplification meta-surfaces, and everything else.

```
X, LinkedIn, GitHub, Instagram, Newsletter, YouTube, Podcast
```

This is what `platformCards(posts)` (`lib/aggregations.ts:133-145`) iterates over.

### Phase 5a discovery target — the 8 platforms

The Phase 5a Codex spec **targets** these 8 for an automated discovery pipeline (the pipeline itself is **out of scope** for the current ship):

```
X, LinkedIn, GitHub, Substack, Instagram, Newsletter, YouTube, Podcast
```

Same as `coreSurfaces` plus `Substack`. The other 10 enum values stay valid as Surface platforms but are not in the discovery scope.

---

## Per-platform handle conventions

How handles and URLs typically render in seed/fixture rows (`prisma/fixtures/intel-report.ts`):

| Platform | Handle convention | URL convention |
|---|---|---|
| `X` | `@danshipper` (with `@`) | `https://x.com/danshipper` |
| `LinkedIn` | Full name (e.g. `Dan Shipper`) | often null in fixtures — D12 compliance |
| `GitHub` | Username, no `@` | `https://github.com/{handle}` |
| `Instagram` | `@danshipper` (with `@`) | optional, `https://instagram.com/{handle}` |
| `Newsletter` | Newsletter name (e.g. `Chain of Thought`) | `https://every.to` (or per-newsletter) |
| `YouTube` | Channel name | `https://every.to/c/youtube` style |
| `Podcast` | Show name (e.g. `AI & I`) | `https://every.to/podcast` |
| `Substack` | `{subdomain}.substack.com` | `https://{subdomain}.substack.com` |
| `Personal Site` | Domain (e.g. `danshipper.com`) | full URL |
| `TikTok` | `@every.to` | `https://www.tiktok.com/@every.to` |
| `Product Hunt` | Product name | `https://www.producthunt.com/products/{slug}` |
| `Website` | Domain | full URL |
| `App Store` | Brand name | optional |
| `Referral` | Path (e.g. `every.to/referrals`) | full URL |
| `Consulting` | Path | full URL |

These are conventions in `intelEmployeeFixtures` and `companySurfaceFixtures`, not enforced by Prisma. Discovery code that lands later (Phase 5a) is the right place to canonicalize.

---

## Court zone defaults

The basic-mode Court Heat zones (`lib/constants.ts:97-107`) place 9 platforms onto the court grid. `id` is the zone key, `(x, y, width, height)` is its rectangle in the 0-100 SVG space:

```
X                          x=18 y=34 w=24 h=22
LinkedIn                   x=58 y=34 w=24 h=22
GitHub                     x=12 y=66 w=18 h=18
Instagram                  x=38 y=68 w=18 h=16
Newsletter                 x=70 y=66 w=20 h=18
YouTube/Podcast            x=42 y=20 w=22 h=16
Launches                   x=42 y=48 w=16 h=16
Teammate Amplification     x=24 y=12 w=22 h=14
External Amplification     x=64 y=12 w=22 h=14
```

YouTube and Podcast share a single basic zone (`"YouTube/Podcast"`); they split apart in advanced mode and in `coreSurfaces`.

The advanced-mode zones (`lib/constants.ts:109-122`) are 12 content-shape labels — `X original posts`, `X replies`, `X quote posts`, `LinkedIn operator posts`, `LinkedIn consulting posts`, `GitHub technical proof`, `Newsletter bylines`, `Product CTAs`, `Personal AI observations`, `Teammate quote posts`, `External founder amplification`, `Launch windows`. These are stored on `Post.advancedZone` (`schema.prisma:173`).

---

## Acquisition coverage by platform

`AcquisitionRoute` (`prisma/schema.prisma:342-356`) maps `(platform, provider)` to a route. The `AcquisitionProvider` enum (`schema.prisma:51-61`) is `X_API | LINKEDIN_API | GITHUB_API | YOUTUBE_API | RSS | SPIDER | PARALLEL | MANUAL | INSTAGRAM_GRAPH`.

`/acquisition` (`app/acquisition/page.tsx`) reads `getAcquisitionRows()` (`lib/queries.ts:489-556`) and surfaces the per-Surface coverage status: `"Live coverage"`, `"Manual import required"`, `"Needs acquisition"`, or `"Awaiting acquisition"`. LinkedIn always falls into `"Manual import required"` due to D12 compliance (`lib/queries.ts:526`).

The doctrine ladder rendered on the page:

1. **Native source** — official APIs and first-party feeds first
2. **Parallel** — cited discovery and enrichment
3. **Spider** — public-page extraction
4. **Manual** — owner export for restricted surfaces
