import { acquisitionSurfaceRequested, inngest } from "@/inngest/client";
import { backfillAcquisitionKey } from "@/lib/acquisition/idempotency";
import { prisma } from "@/lib/prisma";

async function main() {
  const surfaces = await prisma.surface.findMany({
    where: { present: true },
    orderBy: [{ platform: "asc" }, { handle: "asc" }],
  });

  let enqueued = 0;
  const now = new Date();

  for (const surface of surfaces) {
    const idempotencyKey = backfillAcquisitionKey(surface.id, now);
    const existing = await prisma.acquisitionJob.findUnique({ where: { idempotencyKey } });
    if (existing) {
      console.log(`SKIP ${surface.platform} ${surface.handle} (already ${existing.status})`);
      continue;
    }

    await inngest.send(
      acquisitionSurfaceRequested.create({
        surfaceId: surface.id,
        windowDays: 90,
        idempotencyKey,
      }),
    );
    console.log(`ENQUEUED ${surface.platform} ${surface.handle}`);
    enqueued += 1;
  }

  console.log(`\nDone. Enqueued ${enqueued} of ${surfaces.length} surfaces.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
