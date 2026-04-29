/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Inngest } from "inngest";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Cannot connect to the database.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter });
  const inngest = new Inngest({ id: "surface-iq", eventKey: process.env.INNGEST_EVENT_KEY });

  const surfaces = await db.surface.findMany({ where: { present: true } });
  const today = new Date().toISOString().slice(0, 10);
  let enqueued = 0;

  for (const s of surfaces) {
    const idempotencyKey = `${s.id}:backfill-${today}`;
    const existing = await db.acquisitionJob.findUnique({ where: { idempotencyKey } });
    if (existing && existing.status !== "FAILED" && existing.status !== "DEAD_LETTER") {
      console.log(`SKIP ${s.platform} ${s.handle} (already ${existing.status})`);
      continue;
    }
    await inngest.send({
      name: "acquisition/surface.requested",
      data: { surfaceId: s.id, windowDays: 90, idempotencyKey },
    });
    console.log(`ENQUEUED ${s.platform} ${s.handle}`);
    enqueued += 1;
  }

  console.log(`\nDone. Enqueued ${enqueued} of ${surfaces.length} surfaces.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
