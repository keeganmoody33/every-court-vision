import { AcquisitionProvider } from "@prisma/client";
import { NextResponse } from "next/server";

import { persistActivities } from "@/lib/acquisition/persist";
import type { RawActivityInput } from "@/lib/acquisition/types";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    surfaceId?: string;
    activities?: RawActivityInput[];
  };

  if (!body.surfaceId || !Array.isArray(body.activities)) {
    return NextResponse.json({ ok: false, error: "surfaceId_and_activities_required" }, { status: 400 });
  }

  const surface = await db.surface.findUnique({ where: { id: body.surfaceId } });
  if (!surface) return NextResponse.json({ ok: false, error: "surface_not_found" }, { status: 404 });

  const now = new Date();
  const windowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const job = await db.acquisitionJob.create({
    data: {
      surfaceId: body.surfaceId,
      provider: AcquisitionProvider.MANUAL,
      status: "RUNNING",
      windowStart,
      windowEnd: now,
      attempts: 1,
      startedAt: now,
    },
  });

  const result = await persistActivities({
    surfaceId: body.surfaceId,
    jobId: job.id,
    provider: AcquisitionProvider.MANUAL,
    activities: body.activities,
  });

  await db.acquisitionJob.update({
    where: { id: job.id },
    data: {
      status: result.rawCount > 0 ? "SUCCEEDED" : "PARTIAL",
      rawCount: result.rawCount,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, jobId: job.id, result });
}
