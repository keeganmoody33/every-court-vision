import { AcquisitionProvider } from "@prisma/client";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

const UNLIMITED = new Set<AcquisitionProvider>([
  AcquisitionProvider.MANUAL,
  AcquisitionProvider.RSS,
  AcquisitionProvider.LINKEDIN_API,
]);

function capFor(provider: AcquisitionProvider) {
  switch (provider) {
    case AcquisitionProvider.SPIDER:
      return env.SPIDER_DAILY_CAP ?? 200;
    case AcquisitionProvider.PARALLEL:
      return env.PARALLEL_DAILY_CAP ?? 500;
    case AcquisitionProvider.X_API:
      return env.X_API_DAILY_CAP ?? 10000;
    case AcquisitionProvider.GITHUB_API:
      return env.GITHUB_API_DAILY_CAP ?? 4500;
    case AcquisitionProvider.YOUTUBE_API:
      return env.YOUTUBE_API_DAILY_CAP ?? 8000;
    case AcquisitionProvider.INSTAGRAM_GRAPH:
      return env.INSTAGRAM_GRAPH_DAILY_CAP ?? 200;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

function utcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function canConsume(provider: AcquisitionProvider): Promise<{ allowed: boolean; remaining: number; cap: number }> {
  if (UNLIMITED.has(provider)) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, cap: Number.POSITIVE_INFINITY };
  }

  const cap = capFor(provider);
  const day = utcDay();
  const row = await db.providerBudget.upsert({
    where: { provider_day: { provider, day } },
    create: { provider, day, used: 0, cap },
    update: { cap },
  });
  const remaining = Math.max(0, row.cap - row.used);
  return { allowed: remaining > 0, remaining, cap: row.cap };
}

export async function recordConsumption(provider: AcquisitionProvider, count: number): Promise<void> {
  if (UNLIMITED.has(provider) || count <= 0) return;

  const cap = capFor(provider);
  const day = utcDay();
  await db.providerBudget.upsert({
    where: { provider_day: { provider, day } },
    create: { provider, day, used: count, cap },
    update: { used: { increment: count }, cap },
  });
}
