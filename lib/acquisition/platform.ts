import { Platform as DbPlatform } from "@prisma/client";

import type { Platform } from "@/lib/types";

export const platformFromDb: Record<DbPlatform, Platform> = {
  X: "X",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  INSTAGRAM: "Instagram",
  NEWSLETTER: "Newsletter",
  YOUTUBE: "YouTube",
  PODCAST: "Podcast",
  LAUNCHES: "Launches",
  TEAMMATE_AMPLIFICATION: "Teammate Amplification",
  EXTERNAL_AMPLIFICATION: "External Amplification",
  PRODUCT_HUNT: "Product Hunt",
  PERSONAL_SITE: "Personal Site",
  TIKTOK: "TikTok",
  WEBSITE: "Website",
  SUBSTACK: "Substack",
  APP_STORE: "App Store",
  REFERRAL: "Referral",
  CONSULTING: "Consulting",
};

export function providerLabel(provider: string) {
  const labels: Record<string, string> = {
    X_API: "X API",
    LINKEDIN_API: "LinkedIn API",
    GITHUB_API: "GitHub API",
    YOUTUBE_API: "YouTube API",
    RSS: "RSS",
    SPIDER: "Spider",
    PARALLEL: "Parallel",
    MANUAL: "Manual Import",
    INSTAGRAM_GRAPH: "Instagram Graph",
  };
  return labels[provider] ?? provider;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    QUEUED: "Queued",
    RUNNING: "Running",
    SUCCEEDED: "Succeeded",
    PARTIAL: "Partial",
    FAILED: "Failed",
    DISABLED: "Disabled",
  };
  return labels[status] ?? status;
}
