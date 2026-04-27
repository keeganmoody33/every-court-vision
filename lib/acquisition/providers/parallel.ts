import { AcquisitionProvider } from "@prisma/client";

import { env } from "@/lib/env";
import type { ProviderAdapter } from "@/lib/acquisition/types";

export const parallelProvider: ProviderAdapter = {
  provider: AcquisitionProvider.PARALLEL,
  async collect({ surface, windowStart }) {
    if (!env.PARALLEL_API_KEY) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "parallel_disabled",
        failureReason: "PARALLEL_API_KEY is not configured.",
      };
    }

    const objective = `Find public activity from the last 90 days for ${surface.employee?.name ?? surface.handle} on ${surface.platform}. Prefer canonical posts, essays, podcast/video appearances, or public author pages. Return cited public sources only.`;
    try {
      const response = await fetch("https://api.parallel.ai/v1/search", {
        method: "POST",
        headers: {
          "x-api-key": env.PARALLEL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objective,
          search_queries: [
            `${surface.handle} ${surface.platform} Every last 90 days`,
            `${surface.employee?.name ?? surface.handle} Every ${surface.platform} posts`,
          ],
        }),
      });
      if (!response.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `parallel_${response.status}`,
          failureReason: `Parallel request failed with ${response.status}.`,
        };
      }
      const payload = await response.json();
      const text = JSON.stringify(payload).slice(0, 4000);
      return {
        status: "success",
        activities: [
          {
            externalId: `parallel:${surface.id}:${windowStart.toISOString()}`,
            permalink: surface.url ?? undefined,
            publishedAt: new Date(),
            text,
            rawPayload: payload,
            citations: [],
            basis: payload,
            confidence: "ESTIMATED",
          },
        ],
      };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "parallel_fetch_failed",
        failureReason: error instanceof Error ? error.message : "Parallel fetch failed.",
      };
    }
  },
};
