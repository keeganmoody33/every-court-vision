import { AcquisitionProvider, MetricConfidence, Platform, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { assistRate, socialTS, trustGravityScore } from "@/lib/scoring";
import type { PersistResult, RawActivityInput } from "@/lib/acquisition/types";
import type { PostMetrics } from "@/lib/types";

function stableExternalId(activity: RawActivityInput, index: number) {
  if (activity.externalId) return activity.externalId;
  const base = `${activity.permalink ?? ""}:${activity.publishedAt}:${activity.text.slice(0, 80)}:${index}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  return `manual:${hash.toString(16)}`;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function jsonValue(value: unknown, fallback: Prisma.InputJsonValue): Prisma.InputJsonValue {
  if (value === undefined) return fallback;
  const serialized = JSON.stringify(value);
  return serialized === undefined ? fallback : (JSON.parse(serialized) as Prisma.InputJsonValue);
}

function metricsFromActivity(activity: RawActivityInput): PostMetrics {
  const metrics = activity.metrics ?? {};
  const likes = numberValue(metrics.likes);
  const comments = numberValue(metrics.comments);
  const replies = numberValue(metrics.replies);
  const reposts = numberValue(metrics.reposts);
  const quotes = numberValue(metrics.quotes);
  const shares = numberValue(metrics.shares);
  const clicks = numberValue(metrics.clicks);
  const reach = numberValue(metrics.reach || metrics.views);
  const views = numberValue(metrics.views || metrics.reach);
  return {
    views,
    reach,
    likes,
    comments,
    replies,
    reposts,
    quotes,
    shares,
    clicks,
    profileVisits: numberValue(metrics.profileVisits),
    signups: 0,
    paidSubscriptions: 0,
    consultingLeads: 0,
    revenue: 0,
    assistedConversions: 0,
  };
}

function scoresFromMetrics(metrics: PostMetrics) {
  const engagement = metrics.views
    ? ((metrics.likes + metrics.comments + metrics.replies + metrics.reposts + metrics.quotes + metrics.shares) /
        metrics.views) *
      100
    : 0;
  const trustGravity = trustGravityScore(metrics);
  const social = socialTS(metrics);
  const assists = assistRate(metrics);
  return {
    awareness: Math.min(100, metrics.reach / 1000),
    engagement: Math.min(100, engagement * 20),
    trust: trustGravity,
    clicks: Math.min(100, metrics.clicks / 25),
    signups: 0,
    paid: 0,
    consulting: 0,
    revenue: 0,
    assists,
    surfaceIQ: Math.min(100, social + trustGravity * 0.25),
    socialTS: social,
    assistRate: assists,
    trustGravity,
    humanHalo: Math.min(100, metrics.comments + metrics.shares * 2),
  };
}

function contentTypeFor(platform: Platform, text: string) {
  const lower = text.toLowerCase();
  if (platform === "GITHUB") return "Technical Proof";
  if (platform === "NEWSLETTER" || platform === "SUBSTACK") return "Newsletter Byline";
  if (platform === "PODCAST" || platform === "YOUTUBE") return "Podcast Clip";
  if (platform === "LINKEDIN" && lower.includes("consult")) return "Consulting Post";
  if (lower.includes("launch") || lower.includes("ship")) return "Launch Post";
  return platform === "LINKEDIN" ? "Operator Post" : "Original Post";
}

function zoneFor(platform: Platform) {
  // Display-format zone names. Must stay in sync with prisma/seed.ts:zoneFor and the
  // basicZones table in lib/constants.ts. Returning the raw Prisma enum here (e.g.,
  // "LINKEDIN") would break zone grouping on Shot Zones, Court Heat, and Players.
  if (platform === "LINKEDIN") return "LinkedIn";
  if (platform === "GITHUB") return "GitHub";
  if (platform === "INSTAGRAM") return "Instagram";
  if (platform === "NEWSLETTER" || platform === "SUBSTACK") return "Newsletter";
  if (platform === "YOUTUBE" || platform === "PODCAST") return "YouTube/Podcast";
  if (platform === "TEAMMATE_AMPLIFICATION") return "Teammate Amplification";
  if (platform === "EXTERNAL_AMPLIFICATION") return "External Amplification";
  if (platform === "LAUNCHES" || platform === "PRODUCT_HUNT") return "Launches";
  return "X";
}

function coordFor(platform: Platform, externalId: string, publishedAt: Date) {
  const zoneCenters: Partial<Record<Platform, { x: number; y: number }>> = {
    X: { x: 30, y: 45 },
    LINKEDIN: { x: 70, y: 45 },
    GITHUB: { x: 20, y: 75 },
    NEWSLETTER: { x: 78, y: 74 },
    SUBSTACK: { x: 78, y: 74 },
    YOUTUBE: { x: 53, y: 28 },
    PODCAST: { x: 53, y: 28 },
    INSTAGRAM: { x: 47, y: 76 },
    WEBSITE: { x: 54, y: 54 },
    PERSONAL_SITE: { x: 54, y: 54 },
  };
  const center = zoneCenters[platform] ?? { x: 50, y: 50 };
  const seed = `${externalId}:${platform}:${publishedAt.toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  return {
    x: Math.max(6, Math.min(94, center.x + ((hash % 17) - 8))),
    y: Math.max(8, Math.min(92, center.y + (((hash >> 8) % 13) - 6))),
  };
}

export async function persistActivities({
  surfaceId,
  jobId,
  provider,
  activities,
}: {
  surfaceId: string;
  jobId?: string;
  provider: AcquisitionProvider;
  activities: RawActivityInput[];
}): Promise<PersistResult> {
  const surface = await db.surface.findUnique({
    where: { id: surfaceId },
    include: { employee: true },
  });
  if (!surface?.employee) return { rawCount: 0, inserted: 0, updated: 0, skipped: activities.length };

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, activity] of activities.entries()) {
    // Manual imports accept untyped JSON, so defend against malformed rows here.
    // Without this guard, `null.trim()` aborts the entire job and leaves it stuck
    // in RUNNING because the post-loop status update never runs.
    if (typeof activity?.text !== "string") {
      skipped += 1;
      continue;
    }
    const text = activity.text.trim();
    if (!text) {
      skipped += 1;
      continue;
    }
    const externalId = stableExternalId(activity, index);
    const publishedAt = new Date(activity.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) {
      skipped += 1;
      continue;
    }

    const rawMetrics = jsonValue(activity.metrics, {});
    const rawPayload = jsonValue(activity.rawPayload, {});
    const citations = jsonValue(activity.citations, []);
    const basis = activity.basis === undefined ? undefined : jsonValue(activity.basis, {});

    const raw = await db.rawActivity.upsert({
      where: { surfaceId_externalId: { surfaceId, externalId } },
      update: {
        jobId,
        provider,
        permalink: activity.permalink,
        publishedAt,
        text,
        rawMetrics,
        rawPayload,
        citations,
        basis,
        confidence: activity.confidence ?? MetricConfidence.ESTIMATED,
      },
      create: {
        surfaceId,
        jobId,
        provider,
        externalId,
        permalink: activity.permalink,
        publishedAt,
        text,
        rawMetrics,
        rawPayload,
        citations,
        basis,
        confidence: activity.confidence ?? MetricConfidence.ESTIMATED,
      },
    });

    const metrics = metricsFromActivity(activity);
    const scores = scoresFromMetrics(metrics);
    const { x, y } = coordFor(surface.platform, externalId, publishedAt);
    const sourceId = `acquired:${provider.toLowerCase()}`;
    const acquiredAt = new Date();
    const existing = await db.post.findMany({
      where: { OR: [{ rawActivityId: raw.id }, { surfaceId, externalId }] },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) {
      const [canonical, ...duplicates] = existing;

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map((p) => p.id);
        await db.$transaction(async (tx) => {
          await tx.postMetrics.deleteMany({ where: { postId: { in: duplicateIds } } });
          await tx.postScores.deleteMany({ where: { postId: { in: duplicateIds } } });
          await tx.rippleEvent.updateMany({
            where: { rootPostId: { in: duplicateIds } },
            data: { rootPostId: canonical.id },
          });
          await tx.post.deleteMany({ where: { id: { in: duplicateIds } } });
          await tx.post.update({
            where: { id: canonical.id },
            data: {
              text,
              permalink: activity.permalink,
              acquiredVia: provider,
              acquiredAt,
              rawActivityId: raw.id,
              sourceId,
              metrics: { upsert: { create: metrics, update: metrics } },
              scores: { upsert: { create: scores, update: scores } },
            },
          });
        });
      } else {
        await db.post.update({
          where: { id: canonical.id },
          data: {
            text,
            permalink: activity.permalink,
            acquiredVia: provider,
            acquiredAt,
            rawActivityId: raw.id,
            sourceId,
            metrics: { upsert: { create: metrics, update: metrics } },
            scores: { upsert: { create: scores, update: scores } },
          },
        });
      }
      updated += 1;
    } else {
      await db.post.create({
        data: {
          employeeId: surface.employeeId!,
          surfaceId,
          externalId,
          permalink: activity.permalink,
          rawActivityId: raw.id,
          acquiredVia: provider,
          acquiredAt,
          sourceId,
          text,
          platform: surface.platform,
          contentType: contentTypeFor(surface.platform, text),
          archetype: surface.employee.archetype ?? "Surface Activity",
          campaign: "90-Day Acquisition",
          ctaType: "Detected",
          brandTouch: "Personal",
          product: "Every",
          launchWindow: false,
          publishedAt,
          x,
          y,
          zone: zoneFor(surface.platform),
          advancedZone: contentTypeFor(surface.platform, text),
          confidence: activity.confidence ?? MetricConfidence.ESTIMATED,
          recommendedPlayId: surface.employee.recommendedPlayId ?? "play-soft-cta",
          metrics: { create: metrics },
          scores: { create: scores },
        },
      });
      inserted += 1;
    }
  }

  return { rawCount: activities.length, inserted, updated, skipped };
}
