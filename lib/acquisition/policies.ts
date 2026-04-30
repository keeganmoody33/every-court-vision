import { AcquisitionProvider, MetricConfidence, Platform } from "@/lib/db-enums";

import type { AcquisitionPolicy } from "@/lib/acquisition/types";

const policy = (
  platform: Platform,
  provider: AcquisitionProvider,
  routeOrder: number,
  capability: string,
  requiredEnv: string | undefined,
  confidence: MetricConfidence,
  complianceNote: string,
): AcquisitionPolicy => ({
  platform,
  provider,
  routeOrder,
  capability,
  requiredEnv,
  confidence,
  complianceNote,
});

export const acquisitionPolicies: AcquisitionPolicy[] = [
  policy("X", "X_API", 1, "User timeline for authored posts in the 90-day window", "X_API_KEY", "DIRECT", "Use official X API. Do not scrape logged-in feeds."),
  policy("X", "MANUAL", 2, "Owner export or curated CSV when API access is unavailable", undefined, "DIRECT", "Requires owner-provided export or explicit manual curation."),
  policy("X", "PARALLEL", 3, "Cited public discovery of canonical profile and notable public posts", "PARALLEL_API_KEY", "ESTIMATED", "Discovery/enrichment only; not primary high-volume post capture."),
  policy("X", "SPIDER", 4, "Public profile extraction fallback", "SPIDER_API_KEY", "ESTIMATED", "Public pages only; no login-wall bypassing."),

  policy("LINKEDIN", "LINKEDIN_API", 1, "Approved member or organization post retrieval", "LINKEDIN_ACCESS_TOKEN", "DIRECT", "Only with approved scopes and account-owner authorization."),
  policy("LINKEDIN", "MANUAL", 2, "Owner-provided personal post export", undefined, "DIRECT", "Preferred fallback for personal LinkedIn activity."),
  policy("LINKEDIN", "PARALLEL", 3, "Public profile discovery and citation enrichment", "PARALLEL_API_KEY", "ESTIMATED", "No protected feed scraping."),

  policy("NEWSLETTER", "RSS", 1, "Publication RSS feed", undefined, "DIRECT", "Use first-party feed when available."),
  policy("NEWSLETTER", "SPIDER", 2, "Public newsletter page extraction", "SPIDER_API_KEY", "ESTIMATED", "Public pages only."),
  policy("NEWSLETTER", "PARALLEL", 3, "Cited public discovery of newsletter posts", "PARALLEL_API_KEY", "ESTIMATED", "Use for enrichment and missing canonical URLs."),
  policy("NEWSLETTER", "MANUAL", 4, "Newsletter platform export", undefined, "DIRECT", "Needed for private analytics and subscriber outcomes."),

  policy("SUBSTACK", "RSS", 1, "Substack publication feed at /feed", undefined, "DIRECT", "Official public RSS where the surface has a publication URL."),
  policy("SUBSTACK", "SPIDER", 2, "Public Substack page extraction", "SPIDER_API_KEY", "ESTIMATED", "Public profile/publication pages only."),
  policy("SUBSTACK", "PARALLEL", 3, "Cited public discovery of Substack posts", "PARALLEL_API_KEY", "ESTIMATED", "Use when feed is missing or sparse."),
  policy("SUBSTACK", "MANUAL", 4, "Manual Substack export", undefined, "DIRECT", "Required for private subscriber analytics."),

  policy("GITHUB", "GITHUB_API", 1, "Public events, repos, and commits", undefined, "DIRECT", "Use public REST API; token only improves rate limits."),
  policy("GITHUB", "PARALLEL", 2, "Repository discovery and cited enrichment", "PARALLEL_API_KEY", "ESTIMATED", "Use to discover relevant repos, not replace REST data."),
  policy("GITHUB", "MANUAL", 3, "Manual repo list", undefined, "DIRECT", "Fallback when public profile is incomplete."),

  policy("YOUTUBE", "YOUTUBE_API", 1, "Channel video search and video statistics", "YOUTUBE_API_KEY", "DIRECT", "Official API; channel ID or handle must be resolvable."),
  policy("YOUTUBE", "PARALLEL", 2, "Channel and episode discovery", "PARALLEL_API_KEY", "ESTIMATED", "Use to find missing channel IDs or relevant appearances."),
  policy("YOUTUBE", "SPIDER", 3, "Public channel/page extraction", "SPIDER_API_KEY", "ESTIMATED", "Public pages only."),
  policy("YOUTUBE", "MANUAL", 4, "Manual video list", undefined, "DIRECT", "Fallback for guest appearances and private analytics."),

  policy("PODCAST", "RSS", 1, "Podcast RSS feed", undefined, "DIRECT", "First-party public feed where available."),
  policy("PODCAST", "SPIDER", 2, "Public podcast page extraction", "SPIDER_API_KEY", "ESTIMATED", "Public pages only."),
  policy("PODCAST", "PARALLEL", 3, "Episode discovery and cited enrichment", "PARALLEL_API_KEY", "ESTIMATED", "Use for appearances and missing feed URLs."),
  policy("PODCAST", "MANUAL", 4, "Manual episode import", undefined, "DIRECT", "Fallback for guest appearance curation."),

  policy("INSTAGRAM", "INSTAGRAM_GRAPH", 1, "Professional account media and basic metrics", "INSTAGRAM_ACCESS_TOKEN", "DIRECT", "Only authorized professional accounts."),
  policy("INSTAGRAM", "MANUAL", 2, "Owner export", undefined, "DIRECT", "Preferred fallback for non-authorized accounts."),
  policy("INSTAGRAM", "PARALLEL", 3, "Public profile discovery", "PARALLEL_API_KEY", "ESTIMATED", "Discovery only; no protected content scraping."),

  policy("WEBSITE", "SPIDER", 1, "Public site crawl/scrape", "SPIDER_API_KEY", "ESTIMATED", "Respect public pages and robots policy."),
  policy("WEBSITE", "PARALLEL", 2, "Cited page discovery and enrichment", "PARALLEL_API_KEY", "ESTIMATED", "Use to find public activity URLs."),
  policy("WEBSITE", "MANUAL", 3, "Manual URL list", undefined, "DIRECT", "Fallback for author pages and private analytics."),

  policy("PERSONAL_SITE", "SPIDER", 1, "Public personal-site crawl/scrape", "SPIDER_API_KEY", "ESTIMATED", "Public pages only."),
  policy("PERSONAL_SITE", "PARALLEL", 2, "Cited public activity discovery", "PARALLEL_API_KEY", "ESTIMATED", "Use to find posts and canonical pages."),
  policy("PERSONAL_SITE", "MANUAL", 3, "Manual URL list", undefined, "DIRECT", "Fallback for sparse or non-indexed sites."),
];

export function policiesForPlatform(platform: Platform) {
  const platformPolicies = acquisitionPolicies.filter((entry) => entry.platform === platform);
  if (platformPolicies.length) return platformPolicies.sort((a, b) => a.routeOrder - b.routeOrder);
  return [
    policy(platform, "SPIDER", 1, "Public-page extraction fallback", "SPIDER_API_KEY", "ESTIMATED", "Public pages only."),
    policy(platform, "PARALLEL", 2, "Cited discovery fallback", "PARALLEL_API_KEY", "ESTIMATED", "Use for discovery and enrichment."),
    policy(platform, "MANUAL", 3, "Manual import", undefined, "DIRECT", "Manual curation required."),
  ];
}
