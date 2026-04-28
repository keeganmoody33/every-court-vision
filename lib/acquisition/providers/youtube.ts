import { AcquisitionProvider } from "@prisma/client";

import { env } from "@/lib/env";
import type { ProviderAdapter, RawActivityInput } from "@/lib/acquisition/types";

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    publishedAt?: string;
    title?: string;
    description?: string;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

function channelIdFromUrl(url: string | null) {
  if (!url) return null;
  const match = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export const youtubeProvider: ProviderAdapter = {
  provider: AcquisitionProvider.YOUTUBE_API,
  async collect({ surface, windowStart }) {
    if (!env.YOUTUBE_API_KEY) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "youtube_disabled",
        failureReason: "YOUTUBE_API_KEY is not configured.",
      };
    }
    const channelId = channelIdFromUrl(surface.url);
    if (!channelId) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "youtube_channel_missing",
        failureReason: "A YouTube channel ID is required before the official API route can run.",
      };
    }

    try {
      const params = new URLSearchParams({
        key: env.YOUTUBE_API_KEY,
        part: "snippet",
        channelId,
        type: "video",
        order: "date",
        maxResults: "50",
        publishedAfter: windowStart.toISOString(),
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (!response.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `youtube_${response.status}`,
          failureReason: `YouTube search failed with ${response.status}.`,
        };
      }
      const payload = (await response.json()) as YouTubeSearchResponse;
      const items = Array.isArray(payload.items) ? payload.items : [];
      const activities: RawActivityInput[] = items.map((item, index) => ({
        externalId: item.id?.videoId ?? `${channelId}:${item.snippet?.publishedAt ?? index}`,
        permalink: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : surface.url ?? undefined,
        publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
        text: [item.snippet?.title, item.snippet?.description].filter(Boolean).join("\n\n"),
        rawPayload: item,
        confidence: "DIRECT",
      }));
      return { status: "success", activities };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "youtube_fetch_failed",
        failureReason: error instanceof Error ? error.message : "YouTube fetch failed.",
      };
    }
  },
};
