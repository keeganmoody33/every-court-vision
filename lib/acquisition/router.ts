import { AcquisitionJobStatus } from "@prisma/client";

import { acquisitionSurfaceRequested, inngest } from "@/inngest/client";
import { manualAcquisitionKey } from "@/lib/acquisition/idempotency";
import { providerFor } from "@/lib/acquisition/providers";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { persistActivities } from "@/lib/acquisition/persist";
import type { AcquisitionRunResult } from "@/lib/acquisition/types";
import { db } from "@/lib/db";
import { flags } from "@/lib/env";

export async function ensureAcquisitionRoutes() {
  const policies = policiesForPlatform("X")
    .concat(policiesForPlatform("LINKEDIN"))
    .concat(policiesForPlatform("NEWSLETTER"))
    .concat(policiesForPlatform("SUBSTACK"))
    .concat(policiesForPlatform("GITHUB"))
    .concat(policiesForPlatform("YOUTUBE"))
    .concat(policiesForPlatform("PODCAST"))
    .concat(policiesForPlatform("INSTAGRAM"))
    .concat(policiesForPlatform("WEBSITE"))
    .concat(policiesForPlatform("PERSONAL_SITE"));

  await Promise.all(
    policies.map((policy) =>
      db.acquisitionRoute.upsert({
        where: {
          platform_provider_routeOrder: {
            platform: policy.platform,
            provider: policy.provider,
            routeOrder: policy.routeOrder,
          },
        },
        update: {
          capability: policy.capability,
          requiredEnv: policy.requiredEnv,
          confidence: policy.confidence,
          complianceNote: policy.complianceNote,
        },
        create: policy,
      }),
    ),
  );
}

export async function runAcquisitionForSurface(
  surfaceId: string,
  windowDays = 90,
  options: { idempotencyKey?: string; forceSync?: boolean } = {},
): Promise<AcquisitionRunResult> {
  if (!options.forceSync && flags.queueDriver === "inngest") {
    const idempotencyKey = options.idempotencyKey ?? manualAcquisitionKey(surfaceId);
    await inngest.send(acquisitionSurfaceRequested.create({ surfaceId, windowDays, idempotencyKey }));
    return {
      surfaceId,
      provider: "MANUAL",
      status: "QUEUED",
      jobId: idempotencyKey,
      idempotencyKey,
      rawCount: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
    };
  }

  await ensureAcquisitionRoutes();
  const surface = await db.surface.findUnique({
    where: { id: surfaceId },
    include: { employee: true },
  });
  if (!surface) {
    return {
      surfaceId,
      provider: "MANUAL",
      status: "FAILED",
      rawCount: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failureCode: "surface_missing",
      failureReason: "Surface was not found.",
    };
  }

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);
  let lastResult: AcquisitionRunResult | null = null;

  for (const policy of policiesForPlatform(surface.platform)) {
    const job = await db.acquisitionJob.create({
      data: {
        surfaceId,
        provider: policy.provider,
        status: "RUNNING",
        windowStart,
        windowEnd,
        attempts: 1,
        startedAt: new Date(),
      },
    });

    const adapter = providerFor(policy.provider);
    const result = await adapter.collect({ surface, policy, windowStart, windowEnd });
    if (result.status !== "success") {
      const status: AcquisitionJobStatus = result.status === "disabled" ? "DISABLED" : "FAILED";
      await db.acquisitionJob.update({
        where: { id: job.id },
        data: {
          status,
          failureCode: result.failureCode,
          failureReason: result.failureReason,
          completedAt: new Date(),
        },
      });
      lastResult = {
        surfaceId,
        provider: policy.provider,
        status,
        rawCount: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failureCode: result.failureCode,
        failureReason: result.failureReason,
      };
      continue;
    }

    const persisted = await persistActivities({
      surfaceId,
      jobId: job.id,
      provider: policy.provider,
      activities: result.activities,
    });
    const status: AcquisitionJobStatus = persisted.rawCount > 0 ? "SUCCEEDED" : "PARTIAL";
    await db.acquisitionJob.update({
      where: { id: job.id },
      data: {
        status,
        rawCount: persisted.rawCount,
        inserted: persisted.inserted,
        updated: persisted.updated,
        skipped: persisted.skipped,
        failureCode: persisted.rawCount > 0 ? null : "no_activity_found",
        failureReason: persisted.rawCount > 0 ? null : "Provider succeeded but returned no activity in the window.",
        completedAt: new Date(),
      },
    });

    lastResult = { surfaceId, provider: policy.provider, status, ...persisted };
    if (persisted.rawCount > 0) return lastResult;
  }

  return (
    lastResult ?? {
      surfaceId,
      provider: "MANUAL",
      status: "FAILED",
      rawCount: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failureCode: "no_routes",
      failureReason: "No acquisition routes were configured for this surface.",
    }
  );
}
