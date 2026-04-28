import { AcquisitionProvider } from "@prisma/client";

import type { ProviderAdapter, RawActivityInput } from "@/lib/acquisition/types";

function feedUrlFor(surfaceUrl: string | null, handle: string) {
  const candidate = surfaceUrl || handle;
  if (!candidate) return null;
  if (candidate.includes("/feed")) return candidate;
  if (candidate.includes("substack.com/@")) return null;
  if (candidate.startsWith("http")) return `${candidate.replace(/\/$/, "")}/feed`;
  if (candidate.includes(".")) return `https://${candidate.replace(/\/$/, "")}/feed`;
  return null;
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1]
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRss(xml: string): RawActivityInput[] {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items.map((item, index) => {
    const link = tagValue(item, "link");
    const guid = tagValue(item, "guid") || link || `rss-${index}`;
    const title = tagValue(item, "title");
    const description = tagValue(item, "description");
    const pubDate = tagValue(item, "pubDate") || tagValue(item, "published");
    return {
      externalId: guid,
      permalink: link || undefined,
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      text: [title, description].filter(Boolean).join("\n\n"),
      rawPayload: { title, description, link, guid, pubDate },
      confidence: "DIRECT",
    };
  });
}

export const rssProvider: ProviderAdapter = {
  provider: AcquisitionProvider.RSS,
  async collect({ surface, windowStart, windowEnd }) {
    const url = feedUrlFor(surface.url, surface.handle);
    if (!url) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "rss_url_missing",
        failureReason: "No RSS-compatible URL was available for this surface.",
      };
    }

    try {
      const response = await fetch(url, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
      if (!response.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `rss_${response.status}`,
          failureReason: `RSS request failed with ${response.status}.`,
        };
      }
      const xml = await response.text();
      const activities = parseRss(xml).filter((activity) => {
        const publishedAt = new Date(activity.publishedAt);
        return publishedAt >= windowStart && publishedAt <= windowEnd && activity.text.trim().length > 0;
      });
      return { status: "success", activities };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "rss_fetch_failed",
        failureReason: error instanceof Error ? error.message : "RSS fetch failed.",
      };
    }
  },
};
