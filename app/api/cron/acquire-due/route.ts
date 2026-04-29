import { NextResponse } from "next/server";

import { acquisitionSurfaceRequested, inngest } from "@/inngest/client";
import { dueSurfaces } from "@/lib/acquisition/cadence";
import { cronAcquisitionKey } from "@/lib/acquisition/idempotency";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

async function handle(req: Request) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const surfaces = await dueSurfaces(now);
  const events = surfaces.map((surface) =>
    acquisitionSurfaceRequested.create({
      surfaceId: surface.id,
      windowDays: 90,
      idempotencyKey: cronAcquisitionKey(surface.id, now),
    }),
  );

  if (events.length > 0) {
    await inngest.send(events);
  }

  return NextResponse.json({ enqueued: events.length, surfaces: surfaces.length });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
