import { AcquisitionProvider } from "@/lib/db-enums";

import { env } from "@/lib/env";
import type { ProviderAdapter, RawActivityInput } from "@/lib/acquisition/types";

interface XUserLookupResponse {
  data?: {
    id?: string;
    public_metrics?: {
      followers_count?: number;
    };
  };
  errors?: Array<{ title?: string; detail?: string }>;
}

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  conversation_id?: string;
  note_tweet?: {
    text?: string;
  };
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
  errors?: Array<{ title?: string; detail?: string }>;
  meta?: {
    next_token?: string;
    result_count?: number;
  };
}

function usernameFromHandle(handle: string) {
  return handle.replace(/^@/, "").trim();
}

function retryAfterSeconds(response: Response) {
  const reset = Number(response.headers.get("x-rate-limit-reset"));
  if (!Number.isFinite(reset) || reset <= 0) return 60;
  return Math.max(1, Math.ceil(reset - Date.now() / 1000));
}

function apiError(prefix: string, response: Response) {
  if (response.status === 429) {
    const retryAfter = retryAfterSeconds(response);
    return {
      status: "failed" as const,
      activities: [],
      failureCode: "x_rate_limited",
      failureReason: `X rate limit reached for ${prefix}. Retry after ${retryAfter}s.`,
      retryAfterSeconds: retryAfter,
    };
  }

  return {
    status: "failed" as const,
    activities: [],
    failureCode: `x_${prefix}_${response.status}`,
    failureReason: `X ${prefix} request failed with ${response.status}.`,
  };
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
      const userParams = new URLSearchParams({ "user.fields": "public_metrics" });
      const userResponse = await fetch(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}?${userParams.toString()}`, {
        headers: { Authorization: `Bearer ${env.X_API_KEY}` },
      });
      if (!userResponse.ok) {
        return apiError("user", userResponse);
      }
      const userPayload = (await userResponse.json()) as XUserLookupResponse;
      const userId = userPayload?.data?.id;
      if (!userId) {
        return { status: "failed", activities: [], failureCode: "x_user_missing", failureReason: "X user ID missing." };
      }

      const tweets: XTweet[] = [];
      const maxTweets = env.X_TIMELINE_MAX_TWEETS ?? 1000;
      let nextToken: string | undefined;

      do {
        const params = new URLSearchParams({
          max_results: "100",
          start_time: windowStart.toISOString(),
          end_time: windowEnd.toISOString(),
          "tweet.fields": "created_at,public_metrics,conversation_id,note_tweet",
          exclude: "retweets",
        });
        if (nextToken) params.set("pagination_token", nextToken);

        const tweetResponse = await fetch(`https://api.x.com/2/users/${userId}/tweets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${env.X_API_KEY}` },
        });
        if (!tweetResponse.ok) {
          return apiError("timeline", tweetResponse);
        }
        const payload = (await tweetResponse.json()) as XTimelineResponse;
        if (Array.isArray(payload.data)) {
          tweets.push(...payload.data);
        }
        nextToken = payload.meta?.next_token;
      } while (nextToken && tweets.length < maxTweets);

      const activities: RawActivityInput[] = tweets.slice(0, maxTweets).map((tweet) => ({
        externalId: tweet.id,
        permalink: `https://x.com/${username}/status/${tweet.id}`,
        publishedAt: tweet.created_at,
        text: tweet.note_tweet?.text ?? tweet.text,
        conversationId: tweet.conversation_id,
        metrics: {
          views: tweet.public_metrics?.impression_count,
          reach: tweet.public_metrics?.impression_count,
          likes: tweet.public_metrics?.like_count,
          replies: tweet.public_metrics?.reply_count,
          reposts: tweet.public_metrics?.retweet_count,
          quotes: tweet.public_metrics?.quote_count,
        },
        rawPayload: tweet,
        basis: {
          conversationId: tweet.conversation_id,
          userFollowers: userPayload.data?.public_metrics?.followers_count,
        },
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
