import "server-only";

import { Prisma } from "@prisma/client";

import { platformFromDb } from "@/lib/acquisition/platform";
import { db } from "@/lib/db";
import { classifyIntentWithLLM } from "@/lib/intent/llm";
import { computeIntentMetrics } from "@/lib/intent/metrics";
import { classifyOutcome } from "@/lib/intent/outcome";
import { postToCoord } from "@/lib/intent/courtMapping";
import { intentClassFromDb, intentClassToDb, shotOutcomeFromDb, shotOutcomeToDb } from "@/lib/intent/dbMapping";
import { assistRate, socialTS } from "@/lib/scoring";
import type { IntentClass, PostMetrics, PostScores, ShotOutcome } from "@/lib/types";

const WINDOWS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

type PostWithAnalytics = {
  id: string;
  employeeId: string;
  surfaceId: string | null;
  text: string;
  platform: keyof typeof platformFromDb;
  brandTouch: string;
  publishedAt: Date;
  intentClass: keyof typeof intentClassFromDb;
  outcome: keyof typeof shotOutcomeFromDb;
  isAssist: boolean;
  metrics: (PostMetrics & { id?: string; postId?: string }) | null;
  scores: (PostScores & { id?: string; postId?: string }) | null;
};

function sumMetrics(metrics: PostMetrics[]): PostMetrics {
  return metrics.reduce<PostMetrics>(
    (sum, metric) => ({
      views: sum.views + metric.views,
      reach: sum.reach + metric.reach,
      likes: sum.likes + metric.likes,
      comments: sum.comments + metric.comments,
      replies: sum.replies + metric.replies,
      reposts: sum.reposts + metric.reposts,
      quotes: sum.quotes + metric.quotes,
      shares: sum.shares + metric.shares,
      clicks: sum.clicks + metric.clicks,
      profileVisits: sum.profileVisits + metric.profileVisits,
      signups: sum.signups + metric.signups,
      paidSubscriptions: sum.paidSubscriptions + metric.paidSubscriptions,
      consultingLeads: sum.consultingLeads + metric.consultingLeads,
      revenue: sum.revenue + metric.revenue,
      assistedConversions: sum.assistedConversions + metric.assistedConversions,
    }),
    {
      views: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      shares: 0,
      clicks: 0,
      profileVisits: 0,
      signups: 0,
      paidSubscriptions: 0,
      consultingLeads: 0,
      revenue: 0,
      assistedConversions: 0,
    },
  );
}

function metricData(posts: PostWithAnalytics[], windowDays: number) {
  const metrics = sumMetrics(posts.flatMap((post) => (post.metrics ? [post.metrics] : [])));
  const intentMetrics = computeIntentMetrics(
    posts.flatMap((post) =>
      post.metrics
        ? [
            {
              brandTouch: post.brandTouch as "Every" | "Personal" | "Product" | "Partner",
              intentClass: intentClassFromDb[post.intentClass],
              outcome: shotOutcomeFromDb[post.outcome],
              isAssist: post.isAssist,
              metrics: post.metrics,
            },
          ]
        : [],
    ),
    windowDays,
  );

  return {
    posts: posts.length,
    ...metrics,
    surfaceIQ: posts.length
      ? posts.reduce((sum, post) => sum + (post.scores?.surfaceIQ ?? 0), 0) / Math.max(1, posts.length)
      : 0,
    socialTS: socialTS(metrics),
    assistRate: assistRate(metrics),
    trustGravity: posts.length
      ? posts.reduce((sum, post) => sum + (post.scores?.trustGravity ?? 0), 0) / Math.max(1, posts.length)
      : 0,
    ...intentMetrics,
  };
}

async function metricUpsertsForEmployee(employeeId: string, now = new Date()) {
  const posts = await db.post.findMany({
    where: { employeeId, surfaceId: { not: null } },
    include: { metrics: true, scores: true },
  });
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const { label, days } of WINDOWS) {
    const windowStart = new Date(now.getTime() - days * 86_400_000);
    const windowPosts = posts.filter((post) => post.publishedAt >= windowStart && post.surfaceId);
    const bySurface = new Map<string, typeof windowPosts>();

    for (const post of windowPosts) {
      const rows = bySurface.get(post.surfaceId!) ?? [];
      rows.push(post);
      bySurface.set(post.surfaceId!, rows);
    }

    for (const rows of bySurface.values()) {
      const data = metricData(rows, days);
      operations.push(
        db.metric.upsert({
          where: {
            employeeId_surfaceId_timeWindow_windowStart: {
              employeeId,
              surfaceId: rows[0].surfaceId!,
              timeWindow: label,
              windowStart,
            },
          },
          create: {
            employeeId,
            surfaceId: rows[0].surfaceId!,
            platform: rows[0].platform,
            timeWindow: label,
            windowStart,
            windowEnd: now,
            ...data,
          },
          update: {
            windowEnd: now,
            ...data,
          },
        }),
      );
    }
  }

  return operations;
}

export async function refreshIntentMetricRowsForEmployee(employeeId: string) {
  const operations = await metricUpsertsForEmployee(employeeId);
  if (!operations.length) return 0;
  await db.$transaction(operations);
  return operations.length;
}

interface RecategorizeResult {
  posts: number;
  llmEscalations: number;
  metricsRecomputed: number;
  refined: number;
  skipped: number;
  errors: number;
}

export async function recategorizeForEmployee(employeeId: string): Promise<RecategorizeResult> {
  const candidates = await db.post.findMany({
    where: {
      employeeId,
      classifiedBy: "keyword",
      intentConfidence: { lt: 0.7 },
    },
    include: { employee: true, metrics: true, scores: true },
  });

  if (!process.env.OPENAI_API_KEY) {
    return { posts: candidates.length, llmEscalations: 0, metricsRecomputed: 0, refined: 0, skipped: candidates.length, errors: 0 };
  }

  const updates: {
    id: string;
    intentClass: IntentClass;
    intentConfidence: number;
    outcome: ShotOutcome;
    recovered: boolean;
    isAssist: boolean;
    x: number;
    y: number;
    zone: string;
  }[] = [];
  let errors = 0;

  for (const post of candidates) {
    if (!post.metrics || !post.scores) {
      errors += 1;
      continue;
    }
    const platform = platformFromDb[post.platform];
    const llm = await classifyIntentWithLLM(post.text, {
      name: post.employee.name,
      role: post.employee.role,
      platform,
    });
    if (!llm) {
      errors += 1;
      continue;
    }
    const outcome = classifyOutcome(
      {
        text: post.text,
        metrics: post.metrics,
        scores: post.scores,
      },
      llm.intentClass,
    );
    const coord = postToCoord(post.id, post.employeeId, llm.intentClass, outcome.outcome, platform);
    updates.push({
      id: post.id,
      intentClass: llm.intentClass,
      intentConfidence: llm.intentConfidence,
      outcome: outcome.outcome,
      recovered: outcome.recovered,
      isAssist: llm.isAssist,
      ...coord,
    });
  }

  if (updates.length) {
    await db.$transaction(
      updates.map((update) =>
        db.post.updateMany({
          where: { id: update.id, classifiedBy: { not: "manual" } },
          data: {
            intentClass: intentClassToDb[update.intentClass],
            intentConfidence: update.intentConfidence,
            outcome: shotOutcomeToDb[update.outcome],
            recovered: update.recovered,
            isAssist: update.isAssist,
            x: update.x,
            y: update.y,
            zone: update.zone,
            classifiedAt: new Date(),
            classifiedBy: "llm",
          },
        }),
      ),
    );
    const metricOperations = await metricUpsertsForEmployee(employeeId);
    if (metricOperations.length) {
      await db.$transaction(metricOperations);
    }

    return {
      posts: candidates.length,
      llmEscalations: updates.length,
      metricsRecomputed: metricOperations.length,
      refined: updates.length,
      skipped: candidates.length - updates.length - errors,
      errors,
    };
  }

  return {
    posts: candidates.length,
    llmEscalations: updates.length,
    metricsRecomputed: 0,
    refined: updates.length,
    skipped: candidates.length - updates.length - errors,
    errors,
  };
}

export async function recategorizeAllLowConfidence(): Promise<{ refined: number; skipped: number; errors: number }> {
  const employees = await db.employee.findMany({
    where: { posts: { some: { classifiedBy: "keyword", intentConfidence: { lt: 0.7 } } } },
    select: { id: true },
  });

  let refined = 0;
  let skipped = 0;
  let errors = 0;
  for (const employee of employees) {
    const result = await recategorizeForEmployee(employee.id);
    refined += result.refined;
    skipped += result.skipped;
    errors += result.errors;
  }
  return { refined, skipped, errors };
}
