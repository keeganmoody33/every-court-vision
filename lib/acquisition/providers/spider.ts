import { AcquisitionProvider } from "@/lib/db-enums";

import { env } from "@/lib/env";
import type { ProviderAdapter } from "@/lib/acquisition/types";

export const spiderProvider: ProviderAdapter = {
  provider: AcquisitionProvider.SPIDER,
  async collect({ surface }) {
    // D12 runtime fence: Spider must never touch LinkedIn. The policy table omits
    // SPIDER from the LinkedIn route chain, but a future bug or a misconfigured
    // surface could route here. Refuse declaratively.
    if (
      surface.platform === "LINKEDIN" ||
      surface.url?.toLowerCase().includes("linkedin.com")
    ) {
      return {
        status: "failed",
        activities: [],
        failureCode: "compliance_violation",
        failureReason: "Spider is not permitted for LinkedIn surfaces (D12).",
      };
    }
    if (!env.SPIDER_API_KEY) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "spider_disabled",
        failureReason: "SPIDER_API_KEY is not configured.",
      };
    }
    const url = surface.url;
    if (!url) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "surface_url_missing",
        failureReason: "Spider needs a public URL for this surface.",
      };
    }

    try {
      const response = await fetch("https://api.spider.cloud/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SPIDER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, return_format: "markdown" }),
      });
      if (!response.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `spider_${response.status}`,
          failureReason: `Spider request failed with ${response.status}.`,
        };
      }
      const payload = await response.json();
      const markdown = JSON.stringify(payload);
      return {
        status: "success",
        activities: [
          {
            externalId: `spider:${url}`,
            permalink: url,
            publishedAt: new Date(),
            text: markdown.slice(0, 4000),
            rawPayload: payload,
            confidence: "ESTIMATED",
          },
        ],
      };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "spider_fetch_failed",
        failureReason: error instanceof Error ? error.message : "Spider fetch failed.",
      };
    }
  },
};
