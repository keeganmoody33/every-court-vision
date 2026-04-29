import "server-only";

import { AcquisitionProvider } from "@prisma/client";

import { db } from "@/lib/db";

const DEFAULT_CAPS: Partial<Record<AcquisitionProvider, number>> = {
  SPIDER: Number(process.env.SPIDER_DAILY_CAP) || 200,
  PARALLEL: Number(process.env.PARALLEL_DAILY_CAP) || 500,
  X_API: Number(process.env.X_API_DAILY_CAP) || 10_000,
  GITHUB_API: Number(process.env.GITHUB_API_DAILY_CAP) || 4_500,
  YOUTUBE_API: Number(process.env.YOUTUBE_API_DAILY_CAP) || 8_000,
  INSTAGRAM_GRAPH: Number(process.env.INSTAGRAM_GRAPH_DAILY_CAP) || 200,
};

const UNCAPPED: Set<AcquisitionProvider> = new Set(["MANUAL", "RSS", "LINKEDIN_API"]);

function todayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function canConsume(
  provider: AcquisitionProvider,
): Promise<{ allowed: boolean; remaining: number; cap: number }> {
  if (UNCAPPED.has(provider)) {
    return { allowed: true, remaining: Infinity, cap: Infinity };
  }

  const cap = DEFAULT_CAPS[provider] ?? 1_000;
  const day = todayDate();

  const budget = await db.providerBudget.findUnique({
    where: { provider_day: { provider, day } },
  });

  const used = budget?.used ?? 0;
  const remaining = Math.max(0, cap - used);
  return { allowed: remaining > 0, remaining, cap };
}

export async function recordConsumption(
  provider: AcquisitionProvider,
  count: number,
): Promise<void> {
  if (UNCAPPED.has(provider) || count <= 0) return;

  const cap = DEFAULT_CAPS[provider] ?? 1_000;
  const day = todayDate();

  await db.providerBudget.upsert({
    where: { provider_day: { provider, day } },
    create: { provider, day, used: count, cap },
    update: { used: { increment: count } },
  });
}
