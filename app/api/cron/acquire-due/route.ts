import { inngest } from "@/inngest/client";
import { dueSurfaces } from "@/lib/acquisition/cadence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const surfaces = await dueSurfaces();
  const today = new Date().toISOString().slice(0, 10);

  const enqueued = await Promise.all(
    surfaces.map((s) =>
      inngest.send({
        name: "acquisition/surface.requested",
        data: {
          surfaceId: s.id,
          windowDays: 90,
          idempotencyKey: `${s.id}:${today}`,
        },
      }),
    ),
  );

  return Response.json({ enqueued: enqueued.length, surfaces: surfaces.length });
}
