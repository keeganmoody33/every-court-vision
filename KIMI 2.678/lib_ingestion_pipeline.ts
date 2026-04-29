// lib/ingestion/pipeline.ts
// Production-ready ingestion pipeline for Every
// Company surfaces first, then employees

import { prisma } from "@/lib/prisma";

export type IngestionSource = 
  | "youtube_api"
  | "x_api_public"
  | "substack_rss"
  | "github_api";

interface IngestionResult {
  collected: number;
  errors: string[];
}

// ============================================
// YOUTUBE INGESTION
// ============================================

export async function ingestYouTube(
  channelHandle: string = "EveryInc",
  days: number = 90,
): Promise<IngestionResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { collected: 0, errors: ["YOUTUBE_API_KEY not set"] };

  const errors: string[] = [];
  let collected = 0;

  try {
    // Get channel ID from handle
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet,contentDetails&forHandle=${channelHandle}&key=${apiKey}`
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.[0]) {
      return { collected: 0, errors: [`Channel @${channelHandle} not found`] };
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const stats = channel.statistics;
    const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;

    // Update company metrics
    await prisma.company.upsert({
      where: { slug: "every" },
      update: {
        youtubeSubscribers: parseInt(stats.subscriberCount) || 0,
        youtubeViews: parseInt(stats.viewCount) || 0,
        youtubeVideos: parseInt(stats.videoCount) || 0,
      },
      create: {
        id: "comp_every_001",
        name: "Every",
        slug: "every",
        youtubeSubscribers: parseInt(stats.subscriberCount) || 0,
        youtubeViews: parseInt(stats.viewCount) || 0,
        youtubeVideos: parseInt(stats.videoCount) || 0,
        teamSize: 25,
        publicFacingCount: 16,
      },
    });

    if (!playlistId) {
      return { collected: 0, errors: ["No uploads playlist found"] };
    }

    // Fetch videos
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let nextPageToken: string | null = null;
    const videoIds: string[] = [];

    do {
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}&key=${apiKey}`
      );
      const playlistData = await playlistRes.json();

      for (const item of playlistData.items || []) {
        const publishedAt = new Date(item.snippet.publishedAt);
        if (publishedAt < cutoffDate) {
          nextPageToken = null;
          break;
        }
        videoIds.push(item.contentDetails.videoId);
      }

      nextPageToken = playlistData.nextPageToken || null;
    } while (nextPageToken && videoIds.length < 500);

    // Batch fetch video details (50 at a time)
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const videoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${batch.join(",")}&key=${apiKey}`
      );
      const videoData = await videoRes.json();

      for (const video of videoData.items || []) {
        const rawHash = `youtube:${video.id}:${Math.floor(Date.now() / 60000)}`;

        await prisma.rawPost.upsert({
          where: { rawHash },
          update: {
            rawReach: parseInt(video.statistics?.viewCount || "0"),
            rawLikes: parseInt(video.statistics?.likeCount || "0"),
            rawComments: parseInt(video.statistics?.commentCount || "0"),
            rawMetrics: video.statistics,
          },
          create: {
            platform: "youtube",
            nativeId: video.id,
            entityType: "company",
            entityId: "comp_every_001",
            content: video.snippet.title + "\n" + (video.snippet.description || "").slice(0, 500),
            contentType: "video",
            url: `https://youtube.com/watch?v=${video.id}`,
            mediaUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
            postedAt: new Date(video.snippet.publishedAt),
            rawReach: parseInt(video.statistics?.viewCount || "0"),
            rawLikes: parseInt(video.statistics?.likeCount || "0"),
            rawComments: parseInt(video.statistics?.commentCount || "0"),
            rawMetrics: video.statistics,
            rawHash,
          },
        });

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
  days: number = 90,
): Promise<IngestionResult> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return { collected: 0, errors: ["X_BEARER_TOKEN not set"] };

  const errors: string[] = [];
  let collected = 0;

  try {
    // Get user ID
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics,created_at,description`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );
    const userData = await userRes.json();

    if (!userData.data) {
      return { collected: 0, errors: [`X user @${handle} not found`] };
    }

    const userId = userData.data.id;
    const metrics = userData.data.public_metrics;

    // Update entity follower count
    if (entityType === "company") {
      await prisma.company.update({
        where: { id: entityId },
        data: { xFollowers: metrics.followers_count },
      });
    } else {
      await prisma.employee.update({
        where: { id: entityId },
        data: { xFollowers: metrics.followers_count },
      });
    }

    // Fetch tweets
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let nextToken: string | null = null;

    do {
      const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at,entities,referenced_tweets&exclude=replies,retweets${nextToken ? `&pagination_token=${nextToken}` : ""}`;

      const tweetsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      const tweetsData = await tweetsRes.json();

      if (tweetsData.errors) {
        errors.push(...tweetsData.errors.map((e: any) => e.message));
        break;
      }

      for (const tweet of tweetsData.data || []) {
        const postedAt = new Date(tweet.created_at);
        if (postedAt < cutoffDate) {
          nextToken = null;
          break;
        }

        const urls = tweet.entities?.urls?.map((u: any) => u.expanded_url) || [];
        const rawHash = `x:${tweet.id}:${Math.floor(Date.now() / 60000)}`;

        await prisma.rawPost.upsert({
          where: { rawHash },
          update: {
            rawReach: tweet.public_metrics?.impression_count || 0,
            rawLikes: tweet.public_metrics?.like_count || 0,
            rawReposts: tweet.public_metrics?.retweet_count || 0,
            rawReplies: tweet.public_metrics?.reply_count || 0,
            rawMetrics: tweet.public_metrics,
          },
          create: {
            platform: "x",
            nativeId: tweet.id,
            entityType,
            entityId,
            content: tweet.text,
            contentType: tweet.referenced_tweets ? "retweet" : "text",
            url: `https://x.com/${handle}/status/${tweet.id}`,
            postedAt,
            rawReach: tweet.public_metrics?.impression_count || 0,
            rawLikes: tweet.public_metrics?.like_count || 0,
            rawReposts: tweet.public_metrics?.retweet_count || 0,
            rawReplies: tweet.public_metrics?.reply_count || 0,
            rawClicks: tweet.public_metrics?.url_link_clicks || 0,
            rawMetrics: tweet.public_metrics,
            extractedUrls: urls,
            rawHash,
          },
        });

        collected++;
      }

      nextToken = tweetsData.meta?.next_token || null;
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
  days: number = 90,
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

    // Parse RSS items
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const items = rssText.match(itemRegex) || [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const item of items) {
      const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const content = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || "";

      const postedAt = new Date(pubDate);
      if (postedAt < cutoffDate) break;
      if (!link) continue;

      const rawHash = `substack:${link}:${Math.floor(Date.now() / 60000)}`;

      await prisma.rawPost.upsert({
        where: { rawHash },
        update: {
          content: title + "\n" + content.slice(0, 500),
        },
        create: {
          platform: "substack",
          nativeId: link,
          entityType,
          entityId,
          content: title + "\n" + content.slice(0, 500),
          contentType: "article",
          url: link,
          postedAt,
          rawMetrics: {},
          rawHash,
        },
      });

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
  days: number = 90,
): Promise<IngestionResult> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Every-Signal-Capture",
  };
  if (token) headers.Authorization = `token ${token}`;

  const errors: string[] = [];
  let collected = 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const endpoint = entityType === "company"
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

      const rawHash = `github:${repo.id}:${Math.floor(Date.now() / 60000)}`;

      await prisma.rawPost.upsert({
        where: { rawHash },
        update: {
          rawStars: repo.stargazers_count || 0,
          rawForks: repo.forks_count || 0,
          rawMetrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            openIssues: repo.open_issues_count,
          },
        },
        create: {
          platform: "github",
          nativeId: repo.id.toString(),
          entityType,
          entityId,
          content: repo.name + "\n" + (repo.description || ""),
          contentType: "repo",
          url: repo.html_url,
          postedAt: pushedAt,
          rawStars: repo.stargazers_count || 0,
          rawForks: repo.forks_count || 0,
          rawMetrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            openIssues: repo.open_issues_count,
          },
          rawHash,
        },
      });

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

  // Company surfaces
  console.log("📺 YouTube (@EveryInc)...");
  results.youtube = await ingestYouTube("EveryInc", 90);

  console.log("🐦 X Company (@every)...");
  results.x_company = await ingestXPublic("every", "company", "comp_every_001", 90);

  console.log("💻 GitHub Org (EveryInc)...");
  results.github_company = await ingestGitHub("EveryInc", "company", "comp_every_001", 90);

  // Employee surfaces
  console.log("🐦 X Dan (@danshipper)...");
  results.x_dan = await ingestXPublic("danshipper", "employee", "emp_001", 90);

  console.log("🐦 X Austin (@austin_tedesco)...");
  results.x_austin = await ingestXPublic("austin_tedesco", "employee", "emp_002", 90);

  console.log("📝 Substack Dan...");
  results.substack_dan = await ingestSubstackRSS("danshipper", "employee", "emp_001", 90);

  console.log("📝 Substack Austin...");
  results.substack_austin = await ingestSubstackRSS("austintedesco", "employee", "emp_002", 90);

  console.log("💻 GitHub Kieran...");
  results.github_kieran = await ingestGitHub("kieranklaassen", "employee", "emp_005", 90);

  return results;
}
