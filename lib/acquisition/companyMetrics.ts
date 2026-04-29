import { prisma } from "@/lib/prisma";

const EVERY_COMPANY_ID = "comp_every_001";

export interface CompanyMetricSyncResult {
  collected: number;
  errors: string[];
}

function numberFrom(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export async function syncYouTubeChannelMetrics(
  channelHandle = "EveryInc",
  companyId = EVERY_COMPANY_ID,
): Promise<CompanyMetricSyncResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { collected: 0, errors: ["YOUTUBE_API_KEY not set"] };

  try {
    const params = new URLSearchParams({
      part: "id,statistics,snippet,contentDetails",
      forHandle: channelHandle,
      key: apiKey,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
    if (!response.ok) return { collected: 0, errors: [`YouTube channel request failed: ${response.status}`] };

    const payload = await response.json();
    const channel = payload.items?.[0];
    if (!channel) return { collected: 0, errors: [`Channel @${channelHandle} not found`] };

    const stats = channel.statistics ?? {};
    await prisma.company.upsert({
      where: { id: companyId },
      update: {
        youtubeSubscribers: numberFrom(stats.subscriberCount),
        youtubeViews: numberFrom(stats.viewCount),
        youtubeVideos: numberFrom(stats.videoCount),
        slug: "every",
      },
      create: {
        id: companyId,
        name: "Every",
        slug: "every",
        domain: "every.to",
        website: "https://every.to",
        youtubeSubscribers: numberFrom(stats.subscriberCount),
        youtubeViews: numberFrom(stats.viewCount),
        youtubeVideos: numberFrom(stats.videoCount),
        teamSize: 25,
        publicFacingCount: 16,
      },
    });

    return { collected: 1, errors: [] };
  } catch (error) {
    return { collected: 0, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

export async function syncGitHubOrgMetrics(
  orgName = "every-io",
  companyId = EVERY_COMPANY_ID,
): Promise<CompanyMetricSyncResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Every-Court-Vision",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const response = await fetch(`https://api.github.com/orgs/${encodeURIComponent(orgName)}/repos?per_page=100`, {
      headers,
    });
    if (!response.ok) return { collected: 0, errors: [`GitHub org repos request failed: ${response.status}`] };

    const payload = await response.json();
    const repos = Array.isArray(payload) ? payload : [];
    await prisma.company.upsert({
      where: { id: companyId },
      update: { githubRepos: repos.length },
      create: {
        id: companyId,
        name: "Every",
        slug: "every",
        domain: "every.to",
        website: "https://every.to",
        githubRepos: repos.length,
        teamSize: 25,
        publicFacingCount: 16,
      },
    });

    return { collected: repos.length, errors: [] };
  } catch (error) {
    return { collected: 0, errors: [error instanceof Error ? error.message : String(error)] };
  }
}
