import { NextResponse } from "next/server";
import { Platform } from "@/lib/db-enums";
import { z } from "zod";

import { runAcquisitionForSurface } from "@/lib/acquisition/router";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const runRequestSchema = z
  .object({
    surfaceId: z.string().optional(),
    employeeId: z.string().optional(),
    platform: z.nativeEnum(Platform).optional(),
    windowDays: z.number().int().min(1).max(365).optional(),
    idempotencyKey: z.string().optional(),
  })
  // Reject empty bodies. Without this, the endpoint runs acquisition for up to 24
  // arbitrary surfaces — uncontrolled fan-out + upstream API quota burn.
  .refine((value) => Boolean(value.surfaceId || value.employeeId || value.platform), {
    message: "Provide at least one of surfaceId, employeeId, or platform.",
  });

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = runRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const surfaces = body.surfaceId
    ? await db.surface.findMany({ where: { id: body.surfaceId } })
    : await db.surface.findMany({
        where: {
          employeeId: body.employeeId,
          platform: body.platform,
          present: true,
        },
        take: 24,
      });

  if (!surfaces.length) {
    return NextResponse.json({ ok: false, error: "no_surfaces_found" }, { status: 404 });
  }

  // TODO(phase-4): Replace sequential loop with concurrency-limited parallelism (e.g.,
  // p-limit with concurrency=4) once live providers are wired. Naive Promise.all hits
  // upstream rate limits; pure sequential will timeout on Vercel at scale. Sequential
  // is fine today because most providers return `disabled` instantly until tokens land.
  const results = [];
  for (const surface of surfaces) {
    results.push(
      await runAcquisitionForSurface(surface.id, body.windowDays ?? 90, {
        idempotencyKey: body.surfaceId ? body.idempotencyKey : undefined,
      }),
    );
  }

  const single = results.length === 1 ? results[0] : undefined;
  return NextResponse.json({
    ok: true,
    results,
    ...(single ? { jobId: single.jobId, status: single.status, idempotencyKey: single.idempotencyKey } : {}),
  });
}
