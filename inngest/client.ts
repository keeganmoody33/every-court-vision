import { Inngest, eventType } from "inngest";
import { z } from "zod";

export const acquisitionSurfaceRequested = eventType("acquisition/surface.requested", {
  schema: z.object({
    surfaceId: z.string(),
    windowDays: z.number().int().min(1).max(365),
    idempotencyKey: z.string(),
  }),
});

export const postsRecategorizeRequested = eventType("acquisition/posts.recategorize-requested", {
  schema: z.object({
    employeeId: z.string(),
  }),
});

export const metricsRecomputeRequested = eventType("acquisition/metrics.recompute-requested", {
  schema: z.object({
    employeeId: z.string(),
  }),
});

export const inngest = new Inngest({
  id: "surface-iq",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
