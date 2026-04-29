import { NextRequest, NextResponse } from "next/server";
import type { Platform } from "@prisma/client";

import { syncGitHubOrgMetrics, syncYouTubeChannelMetrics } from "@/lib/acquisition/companyMetrics";
import { runAcquisitionForSurface } from "@/lib/acquisition/router";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const sourceMatchers: Record<string, { platform?: Platform; handle?: string }> = {
  youtube: { platform: "YOUTUBE" },
  x_company: { platform: "X", handle: "@every" },
  x_dan: { platform: "X", handle: "@danshipper" },
  x_austin: { platform: "X", handle: "@tedescau" },
  substack_dan: { platform: "SUBSTACK", handle: "every.substack.com" },
  substack_austin: { platform: "SUBSTACK", handle: "@tedescau" },
  github: { platform: "GITHUB", handle: "every-io" },
  github_company: { platform: "GITHUB", handle: "every-io" },
  github_kieran: { platform: "GITHUB", handle: "kieranklaassen" },
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");

  try {
    const where = source && sourceMatchers[source]
      ? {
          present: true,
          platform: sourceMatchers[source].platform,
          ...(sourceMatchers[source].handle ? { handle: sourceMatchers[source].handle } : {}),
        }
      : { present: true };
    const surfaces = await db.surface.findMany({ where, orderBy: [{ platform: "asc" }, { handle: "asc" }] });
    const results = [];

    for (const surface of surfaces) {
      results.push(await runAcquisitionForSurface(surface.id, { windowDays: 90, forceSync: true }));
    }

    const metrics = {
      youtube: await syncYouTubeChannelMetrics("EveryInc"),
      github: await syncGitHubOrgMetrics("every-io"),
    };

    return NextResponse.json({ success: true, source: source ?? "all", results, metrics });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
