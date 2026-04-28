import { NextResponse } from "next/server";

import { runAcquisitionForSurface } from "@/lib/acquisition/router";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    surfaceId?: string;
    employeeId?: string;
    platform?: string;
    windowDays?: number;
  };

  const surfaces = body.surfaceId
    ? await db.surface.findMany({ where: { id: body.surfaceId } })
    : await db.surface.findMany({
        where: {
          employeeId: body.employeeId,
          platform: body.platform as never,
          present: true,
        },
        take: 24,
      });

  if (!surfaces.length) {
    return NextResponse.json({ ok: false, error: "no_surfaces_found" }, { status: 404 });
  }

  const results = [];
  for (const surface of surfaces) {
    results.push(await runAcquisitionForSurface(surface.id, body.windowDays ?? 90));
  }

  return NextResponse.json({ ok: true, results });
}
