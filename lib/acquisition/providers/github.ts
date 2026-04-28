import { AcquisitionProvider } from "@prisma/client";

import { env } from "@/lib/env";
import type { ProviderAdapter, RawActivityInput } from "@/lib/acquisition/types";

interface GitHubEvent {
  id?: string;
  type?: string;
  created_at?: string;
  repo?: { name?: string };
}

function loginFromHandle(handle: string) {
  return handle.replace(/^@/, "").trim();
}

export const githubProvider: ProviderAdapter = {
  provider: AcquisitionProvider.GITHUB_API,
  async collect({ surface, windowStart, windowEnd }) {
    const login = loginFromHandle(surface.handle);
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=100`, {
        headers,
      });
      if (!response.ok) {
        return {
          status: "failed",
          activities: [],
          failureCode: `github_${response.status}`,
          failureReason: `GitHub events request failed with ${response.status}.`,
        };
      }
      const payload = await response.json();
      const events: GitHubEvent[] = Array.isArray(payload) ? payload : [];
      const activities: RawActivityInput[] = events
        .filter((event) => {
          if (!event.created_at) return false;
          const createdAt = new Date(event.created_at);
          return createdAt >= windowStart && createdAt <= windowEnd;
        })
        .map((event, index) => ({
          externalId: event.id ?? `${login}:${event.created_at}:${index}`,
          permalink: event.repo?.name ? `https://github.com/${event.repo.name}` : `https://github.com/${login}`,
          publishedAt: event.created_at ?? new Date().toISOString(),
          text: `${event.type ?? "GitHub activity"} in ${event.repo?.name ?? login}`,
          rawPayload: event,
          confidence: "DIRECT",
        }));
      return { status: "success", activities };
    } catch (error) {
      return {
        status: "failed",
        activities: [],
        failureCode: "github_fetch_failed",
        failureReason: error instanceof Error ? error.message : "GitHub fetch failed.",
      };
    }
  },
};
