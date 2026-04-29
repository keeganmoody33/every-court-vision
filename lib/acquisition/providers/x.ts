import { AcquisitionProvider } from "@prisma/client";

import { env } from "@/lib/env";
import type { ProviderAdapter, RawActivityInput } from "@/lib/acquisition/types";

interface XUserLookupResponse {
  data?: { id?: string };
}

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    impression_count?: number;
    like_count?: number;
    reply_count?: number;
    retweet_count?: number;
    quote_count?: number;
  };
}

interface XTimelineResponse {
  data?: XTweet[];
}

function usernameFromHandle(handle: string) {
  return handle.replace(/^@/, "").trim();
}

export const xProvider: ProviderAdapter = {
  provider: AcquisitionProvider.X_API,
  async collect({ surface, windowStart, windowEnd }) {
    if (!env.X_API_KEY) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "x_api_disabled",
        failureReason: "X_API_KEY is not configured.",
      };
    }

    const username = usernameFromHandle(surface.handle);
    try {
      const userResponse = await fetch(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`, {
        headers: { Authorization: `Bearer ${env.X_API_KEY}` },
      });
      if (!userResponse.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `x_user_${userResponse.status}`,
          failureReason: `X user lookup failed with ${userResponse.status}.`,
        };
      }
      const userPayload = (await userResponse.json()) as XUserLookupResponse;
      const userId = userPayload?.data?.id;
      if (!userId) {
        return { status: "failed", activities: [], failureCode: "x_user_missing", failureReason: "X user ID missing." };
      }

      const params = new URLSearchParams({
        max_results: "100",
        start_time: windowStart.toISOString(),
        end_time: windowEnd.toISOString(),
        "tweet.fields": "created_at,public_metrics,conversation_id",
        exclude: "retweets",
      });
      const tweetResponse = await fetch(`https://api.x.com/2/users/${userId}/tweets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${env.X_API_KEY}` },
      });
      if (!tweetResponse.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `x_timeline_${tweetResponse.status}`,
          failureReason: `X timeline request failed with ${tweetResponse.status}.`,
        };
      }
      const payload = (await tweetResponse.json()) as XTimelineResponse;
      const tweets = Array.isArray(payload.data) ? payload.data : [];
      const activities: RawActivityInput[] = tweets.map((tweet) => ({
        externalId: tweet.id,
        permalink: `https://x.com/${username}/status/${tweet.id}`,
        publishedAt: tweet.created_at,
        text: tweet.text,
        metrics: {
          views: tweet.public_metrics?.impression_count,
          reach: tweet.public_metrics?.impression_count,
          likes: tweet.public_metrics?.like_count,
          replies: tweet.public_metrics?.reply_count,
          reposts: tweet.public_metrics?.retweet_count,
          quotes: tweet.public_metrics?.quote_count,
        },
        rawPayload: tweet,
        confidence: "DIRECT",
      }));
      return { status: "success", activities };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "x_fetch_failed",
        failureReason: error instanceof Error ? error.message : "X fetch failed.",
      };
    }
  },
};
