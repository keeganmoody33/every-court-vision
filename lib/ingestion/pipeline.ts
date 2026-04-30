// lib/ingestion/pipeline.ts — ingestion pulls into RawPost (staging) for Every surfaces

import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db-neon";

export type IngestionSource =
  | "youtube_api"
  | "x_api_public"
  | "substack_rss"
  | "github_api";

interface IngestionResult {
  collected: number;
  errors: string[];
}

const EVERY_COMPANY_ID = "comp_every_001";

// ============================================
// YOUTUBE INGESTION
// ============================================

export async function ingestYouTube(
  channelHandle = "EveryInc",
  days = 90,
): Promise<IngestionResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { collected: 0, errors: ["YOUTUBE_API_KEY not set"] };

  const errors: string[] = [];
  let collected = 0;

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet,contentDetails&forHandle=${channelHandle}&key=${apiKey}`,
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.[0]) {
      return { collected: 0, errors: [`Channel @${channelHandle} not found`] };
    }

    const channel = channelData.items[0];
    const stats = channel.statistics;
    const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;

    const subs = parseInt(stats.subscriberCount) || 0;
    const views = parseInt(stats.viewCount) || 0;
    const videos = parseInt(stats.videoCount) || 0;
    const now = new Date();
    await sql`
      INSERT INTO "Company" (
        id, name, slug, domain, website,
        "youtubeSubscribers", "youtubeViews", "youtubeVideos",
        "teamSize", "publicFacingCount",
        "createdAt", "updatedAt"
      ) VALUES (
        ${EVERY_COMPANY_ID}, 'Every', 'every', 'every.to', 'https://every.to',
        ${subs}, ${views}, ${videos},
        25, 16,
        ${now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        "youtubeSubscribers" = EXCLUDED."youtubeSubscribers",
        "youtubeViews" = EXCLUDED."youtubeViews",
        "youtubeVideos" = EXCLUDED."youtubeVideos",
        slug = EXCLUDED.slug,
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    if (!playlistId) {
      return { collected: 0, errors: ["No uploads playlist found"] };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let nextPageToken: string | null = null;
    const videoIds: string[] = [];

    do {
      const playlistRes: Response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}&key=${apiKey}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playlistData = await playlistRes.json() as any;

      let playlistHitCutoff = false;
      for (const item of playlistData.items || []) {
        const publishedAt = new Date(item.snippet.publishedAt);
        if (publishedAt < cutoffDate) {
          playlistHitCutoff = true;
          break;
        }
        videoIds.push(item.contentDetails.videoId);
      }

      nextPageToken = playlistHitCutoff
        ? null
        : playlistData.nextPageToken || null;
    } while (nextPageToken && videoIds.length < 500);

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const videoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${batch.join(",")}&key=${apiKey}`,
      );
      const videoData = await videoRes.json();

      for (const video of videoData.items || []) {
        const rawHash = `youtube:${video.id}`;
        const reach = parseInt(video.statistics?.viewCount || "0");
        const likes = parseInt(video.statistics?.likeCount || "0");
        const comments = parseInt(video.statistics?.commentCount || "0");
        const id = randomUUID();
        const content = `${video.snippet.title}\n${(video.snippet.description || "").slice(0, 500)}`;
        const url = `https://youtube.com/watch?v=${video.id}`;
        const mediaUrl =
          video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || null;
        const postedAt = new Date(video.snippet.publishedAt);
        const collectedAt = new Date();

        await sql`
          INSERT INTO "RawPost" (
            id, platform, "nativeId", "entityType", "entityId",
            content, "contentType", url, "mediaUrl",
            "postedAt", "collectedAt",
            "rawReach", "rawLikes", "rawComments", "rawMetrics",
            "rawHash"
          ) VALUES (
            ${id}, 'youtube', ${video.id}, 'company', ${EVERY_COMPANY_ID},
            ${content}, 'video', ${url}, ${mediaUrl},
            ${postedAt}, ${collectedAt},
            ${reach}, ${likes}, ${comments}, ${JSON.stringify(video.statistics)}::jsonb,
            ${rawHash}
          )
          ON CONFLICT ("rawHash") DO UPDATE SET
            "rawReach" = EXCLUDED."rawReach",
            "rawLikes" = EXCLUDED."rawLikes",
            "rawComments" = EXCLUDED."rawComments",
            "rawMetrics" = EXCLUDED."rawMetrics"
        `;

        collected++;
      }
    }

  } catch (err) {
    errors.push(String(err));
  }

  return { collected, errors };
}

// ============================================
// X API INGESTION (public bearer)
// ============================================

export async function ingestXPublic(
  handle: string,
  entityType: "company" | "employee",
  entityId: string,
  days = 90,
): Promise<IngestionResult> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return { collected: 0, errors: ["X_BEARER_TOKEN not set"] };

  const errors: string[] = [];
  let collected = 0;

  try {
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics,created_at,description`,
      { headers: { Authorization: `Bearer ${bearerToken}` } },
    );
    const userData = await userRes.json();

    if (!userData.data) {
      return { collected: 0, errors: [`X user @${handle} not found`] };
    }

    const userId = userData.data.id;
    const metrics = userData.data.public_metrics;

    if (entityType === "company") {
      await sql`
        UPDATE "Company"
        SET "xFollowers" = ${metrics.followers_count},
            "updatedAt" = ${new Date()}
        WHERE id = ${entityId}
      `;
    } else {
      await sql`
        UPDATE "Employee"
        SET "xFollowers" = ${metrics.followers_count},
            "updatedAt" = ${new Date()}
        WHERE id = ${entityId}
      `;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let nextToken: string | null = null;

    do {
      const tweetsUrl: string = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at,entities,referenced_tweets&exclude=replies,retweets${nextToken ? `&pagination_token=${nextToken}` : ""}`;

      const tweetsRes: Response = await fetch(tweetsUrl, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tweetsData = await tweetsRes.json() as any;

      if (tweetsData.errors) {
        errors.push(...tweetsData.errors.map((e: { message?: string }) => e.message ?? String(e)));
        break;
      }

      let timelineHitCutoff = false;
      for (const tweet of tweetsData.data || []) {
        const postedAt = new Date(tweet.created_at);
        if (postedAt < cutoffDate) {
          timelineHitCutoff = true;
          break;
        }

        const urls = (tweet.entities?.urls
          ?.map((u: { expanded_url?: string }) => u.expanded_url)
          .filter(Boolean) as string[] | undefined) ?? [];
        const rawHash = `x:${tweet.id}`;
        const id = randomUUID();
        const reach = tweet.public_metrics?.impression_count || 0;
        const likes = tweet.public_metrics?.like_count || 0;
        const reposts = tweet.public_metrics?.retweet_count || 0;
        const replies = tweet.public_metrics?.reply_count || 0;
        const clicks = tweet.public_metrics?.url_link_clicks || 0;
        const contentType = tweet.referenced_tweets ? "quote" : "text";
        const xUrl = `https://x.com/${handle}/status/${tweet.id}`;
        const collectedAt = new Date();

        await sql`
          INSERT INTO "RawPost" (
            id, platform, "nativeId", "entityType", "entityId",
            content, "contentType", url,
            "postedAt", "collectedAt",
            "rawReach", "rawLikes", "rawReposts", "rawReplies", "rawClicks",
            "rawMetrics", "extractedUrls", "rawHash"
          ) VALUES (
            ${id}, 'x', ${tweet.id}, ${entityType}, ${entityId},
            ${tweet.text}, ${contentType}, ${xUrl},
            ${postedAt}, ${collectedAt},
            ${reach}, ${likes}, ${reposts}, ${replies}, ${clicks},
            ${JSON.stringify(tweet.public_metrics)}::jsonb,
            ${urls},
            ${rawHash}
          )
          ON CONFLICT ("rawHash") DO UPDATE SET
            "rawReach" = EXCLUDED."rawReach",
            "rawLikes" = EXCLUDED."rawLikes",
            "rawReposts" = EXCLUDED."rawReposts",
            "rawReplies" = EXCLUDED."rawReplies",
            "rawMetrics" = EXCLUDED."rawMetrics"
        `;

        collected++;
      }

      nextToken = timelineHitCutoff
        ? null
        : tweetsData.meta?.next_token || null;
    } while (nextToken && collected < 1000);
  } catch (err) {
    errors.push(String(err));
  }

  return { collected, errors };
}

// ============================================
// SUBSTACK RSS INGESTION (no auth)
// ============================================

export async function ingestSubstackRSS(
  handle: string,
  entityType: "company" | "employee",
  entityId: string,
  days = 90,
): Promise<IngestionResult> {
  const errors: string[] = [];
  let collected = 0;

  try {
    const rssUrl = `https://${handle}.substack.com/feed`;
    const rssRes = await fetch(rssUrl, { headers: { "User-Agent": "Every-Signal-Capture/1.0" } });

    if (!rssRes.ok) {
      return { collected: 0, errors: [`RSS fetch failed: ${rssRes.status}`] };
    }

    const rssText = await rssRes.text();

    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const items = rssText.match(itemRegex) || [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const item of items) {
      const title =
        item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || "";
      const link =
        item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
      const pubDate =
        item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
      const content =
        item.match(
          /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/,
        )?.[1] || "";

      const postedAt = new Date(pubDate);
      if (isNaN(postedAt.getTime())) continue;
      if (postedAt < cutoffDate) break;
      if (!link) continue;

      const rawHash = `substack:${link}`;
      const fullContent = title + "\n" + content.slice(0, 500);
      const id = randomUUID();
      const collectedAt = new Date();

      await sql`
        INSERT INTO "RawPost" (
          id, platform, "nativeId", "entityType", "entityId",
          content, "contentType", url,
          "postedAt", "collectedAt",
          "rawMetrics", "rawHash"
        ) VALUES (
          ${id}, 'substack', ${link}, ${entityType}, ${entityId},
          ${fullContent}, 'article', ${link},
          ${postedAt}, ${collectedAt},
          ${JSON.stringify({})}::jsonb, ${rawHash}
        )
        ON CONFLICT ("rawHash") DO UPDATE SET
          content = EXCLUDED.content
      `;

      collected++;
    }
  } catch (err) {
    errors.push(String(err));
  }

  return { collected, errors };
}

// ============================================
// GITHUB INGESTION
// ============================================

export async function ingestGitHub(
  orgOrUser: string,
  entityType: "company" | "employee",
  entityId: string,
  days = 90,
): Promise<IngestionResult> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Every-Signal-Capture",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const errors: string[] = [];
  let collected = 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const endpoint =
      entityType === "company"
        ? `https://api.github.com/orgs/${orgOrUser}/repos`
        : `https://api.github.com/users/${orgOrUser}/repos`;

    const reposRes = await fetch(`${endpoint}?sort=pushed&per_page=100`, { headers });
    const reposData = await reposRes.json();

    if (!Array.isArray(reposData)) {
      return { collected: 0, errors: ["GitHub API returned non-array"] };
    }

    for (const repo of reposData) {
      const pushedAt = new Date(repo.pushed_at);
      if (pushedAt < cutoffDate) continue;

      const rawHash = `github:${repo.id}`;
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;
      const repoMetrics = {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        openIssues: repo.open_issues_count,
      };
      const id = randomUUID();
      const repoContent = repo.name + "\n" + (repo.description || "");
      const collectedAt = new Date();

      await sql`
        INSERT INTO "RawPost" (
          id, platform, "nativeId", "entityType", "entityId",
          content, "contentType", url,
          "postedAt", "collectedAt",
          "rawStars", "rawForks", "rawMetrics", "rawHash"
        ) VALUES (
          ${id}, 'github', ${repo.id.toString()}, ${entityType}, ${entityId},
          ${repoContent}, 'repo', ${repo.html_url},
          ${pushedAt}, ${collectedAt},
          ${stars}, ${forks}, ${JSON.stringify(repoMetrics)}::jsonb, ${rawHash}
        )
        ON CONFLICT ("rawHash") DO UPDATE SET
          "rawStars" = EXCLUDED."rawStars",
          "rawForks" = EXCLUDED."rawForks",
          "rawMetrics" = EXCLUDED."rawMetrics"
      `;

      collected++;
    }
  } catch (err) {
    errors.push(String(err));
  }

  return { collected, errors };
}

// ============================================
// RUN ALL
// ============================================

export async function runFullIngestion(): Promise<Record<string, IngestionResult>> {
  const results: Record<string, IngestionResult> = {};

  console.log("YouTube (@EveryInc)...");
  results.youtube = await ingestYouTube("EveryInc", 90);

  console.log("X Company (@every)...");
  results.x_company = await ingestXPublic("every", "company", EVERY_COMPANY_ID, 90);

  console.log("GitHub Org (EveryInc)...");
  results.github_company = await ingestGitHub("EveryInc", "company", EVERY_COMPANY_ID, 90);

  console.log("X Dan (@danshipper)...");
  results.x_dan = await ingestXPublic("danshipper", "employee", "emp_001", 90);

  console.log("X Austin (@austin_tedesco)...");
  results.x_austin = await ingestXPublic("austin_tedesco", "employee", "emp_002", 90);

  console.log("Substack Dan...");
  results.substack_dan = await ingestSubstackRSS("danshipper", "employee", "emp_001", 90);

  console.log("Substack Austin...");
  results.substack_austin = await ingestSubstackRSS("austintedesco", "employee", "emp_002", 90);

  console.log("GitHub Kieran...");
  results.github_kieran = await ingestGitHub("kieranklaassen", "employee", "emp_005", 90);

  return results;
}
