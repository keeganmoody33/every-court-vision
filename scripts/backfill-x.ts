// Run from project root: pnpm backfill:x
//
// Idempotent: existing successful/partial X_API acquisition jobs for the
// 90-day window short-circuit. Real tweet rows are written through
// lib/acquisition/persist.ts, which dedupes by surface/externalId.

import { AcquisitionProvider, AcquisitionJobStatus } from "@/lib/db-enums";

import { runAcquisitionForSurface } from "@/lib/acquisition/router";
import { prisma } from "@/lib/prisma";

const WINDOW_DAYS = 90;

async function hasRecentSuccessfulXJob(surfaceId: string, cutoff: Date) {
  const job = await prisma.acquisitionJob.findFirst({
    where: {
      surfaceId,
      provider: AcquisitionProvider.X_API,
      status: { in: [AcquisitionJobStatus.SUCCEEDED, AcquisitionJobStatus.PARTIAL] },
      windowStart: { lte: cutoff },
    },
    orderBy: { completedAt: "desc" },
    select: { status: true, rawCount: true },
  });
  return job;
}

async function main() {
  const xSurfaces = await prisma.surface.findMany({
    where: { platform: "X", present: true },
    include: { employee: true },
    orderBy: [{ handle: "asc" }],
  });

  console.log(`Found ${xSurfaces.length} X surfaces to backfill (${WINDOW_DAYS} days each).\n`);

  let total = 0;
  let succeeded = 0;
  let failed = 0;
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const xApiConfigured = Boolean(process.env.X_API_KEY);

  for (const surface of xSurfaces) {
    const handle = surface.handle;
    const name = surface.employee?.name ?? "Every";
    process.stdout.write(`  ${name.padEnd(28)} ${handle.padEnd(28)} `);

    const existing = xApiConfigured ? await hasRecentSuccessfulXJob(surface.id, cutoff) : null;
    if (existing) {
      process.stdout.write(`ok    0 tweets (already ${existing.status})\n`);
      succeeded += 1;
      continue;
    }

    try {
      const result = await runAcquisitionForSurface(surface.id, {
        windowDays: WINDOW_DAYS,
        forceSync: true,
        onlyProvider: AcquisitionProvider.X_API,
      });
      if (result.status === "SUCCEEDED" || result.status === "PARTIAL") {
        process.stdout.write(`ok ${String(result.rawCount).padStart(4)} tweets\n`);
        total += result.rawCount;
        succeeded += 1;
      } else {
        process.stdout.write(`fail ${result.failureCode ?? "unknown"}\n`);
        failed += 1;
      }
    } catch (error) {
      process.stdout.write(`fail ${error instanceof Error ? error.message : String(error)}\n`);
      failed += 1;
    }
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed, ${total} total tweets persisted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
