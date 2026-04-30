import { Platform } from "@/lib/db-enums";
import type { Surface } from "@/lib/db-types";

import { sql } from "@/lib/db-neon";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

const DAILY_PLATFORMS = new Set<Platform>([
  Platform.LINKEDIN,
  Platform.GITHUB,
  Platform.SUBSTACK,
  Platform.NEWSLETTER,
  Platform.PERSONAL_SITE,
  Platform.WEBSITE,
]);

const WEEKLY_PLATFORMS = new Set<Platform>([
  Platform.YOUTUBE,
  Platform.PODCAST,
  Platform.PRODUCT_HUNT,
]);

function easternParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  return {
    weekday: parts.find((part) => part.type === "weekday")?.value,
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
  };
}

function stale(surface: Pick<Surface, "lastScrapedAt">, now: Date, thresholdMs: number) {
  return !surface.lastScrapedAt || now.getTime() - surface.lastScrapedAt.getTime() >= thresholdMs;
}

function isDue(surface: Pick<Surface, "platform" | "lastScrapedAt">, now: Date) {
  if (surface.platform === Platform.X) return stale(surface, now, FIFTEEN_MINUTES);

  const et = easternParts(now);
  if (DAILY_PLATFORMS.has(surface.platform)) {
    return et.hour >= 6 && stale(surface, now, DAY);
  }

  if (WEEKLY_PLATFORMS.has(surface.platform)) {
    return et.weekday === "Mon" && et.hour >= 9 && stale(surface, now, WEEK);
  }

  return false;
}

export async function dueSurfaces(now: Date = new Date()): Promise<Surface[]> {
  const surfaces = (await sql`
    SELECT * FROM "Surface"
    WHERE present = true
    ORDER BY platform ASC, handle ASC
  `) as Surface[];
  return surfaces.filter((surface) => isDue(surface, now));
}
