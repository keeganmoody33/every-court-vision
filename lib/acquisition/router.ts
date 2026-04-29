import { AcquisitionJobStatus } from "@prisma/client";

import { inngest } from "@/inngest/client";
import { persistActivities } from "@/lib/acquisition/persist";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { providerFor } from "@/lib/acquisition/providers";
import type { AcquisitionRunResult } from "@/lib/acquisition/types";
import { db } from "@/lib/db";

export interface QueuedResult {
  jobId: string;
  status: "QUEUED";
}

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
): Promise<AcquisitionRunResult | QueuedResult> {
  await ensureAcquisitionRoutes();

  if (process.env.INNGEST_EVENT_KEY) {
    const windowStart = new Date(Date.now() - windowDays * 86_400_000);
    const idempotencyKey = `${surfaceId}:${windowStart.toISOString()}`;
    await inngest.send({
      name: "acquisition/surface.requested",
      data: { surfaceId, windowDays, idempotencyKey },
    });
    return { jobId: idempotencyKey, status: "QUEUED" };
  }

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
