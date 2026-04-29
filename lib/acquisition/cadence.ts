import "server-only";

import { Platform } from "@prisma/client";

import { db } from "@/lib/db";

interface CadenceRule {
  platforms: Platform[];
  intervalMs: number;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

const CADENCE_RULES: CadenceRule[] = [
  { platforms: ["X"], intervalMs: FIFTEEN_MINUTES },
  {
    platforms: ["LINKEDIN", "GITHUB", "SUBSTACK", "NEWSLETTER", "PERSONAL_SITE", "WEBSITE"],
    intervalMs: ONE_DAY,
  },
  { platforms: ["YOUTUBE", "PODCAST", "PRODUCT_HUNT"], intervalMs: ONE_WEEK },
];

const MANUAL_PLATFORMS: Set<Platform> = new Set([
  "INSTAGRAM",
  "TIKTOK",
  "LAUNCHES",
  "TEAMMATE_AMPLIFICATION",
  "EXTERNAL_AMPLIFICATION",
  "APP_STORE",
  "REFERRAL",
  "CONSULTING",
]);

function intervalForPlatform(platform: Platform): number | null {
  if (MANUAL_PLATFORMS.has(platform)) return null;
  for (const rule of CADENCE_RULES) {
    if (rule.platforms.includes(platform)) return rule.intervalMs;
  }
  return ONE_DAY;
}

export async function dueSurfaces(now: Date = new Date()) {
  const surfaces = await db.surface.findMany({
    where: { present: true, employeeId: { not: null } },
    select: { id: true, platform: true, handle: true, lastScrapedAt: true },
  });

  return surfaces.filter((surface) => {
    const interval = intervalForPlatform(surface.platform);
    if (interval === null) return false;
    if (!surface.lastScrapedAt) return true;
    return now.getTime() - surface.lastScrapedAt.getTime() >= interval;
  });
}
