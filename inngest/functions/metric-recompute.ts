import { inngest, metricsRecomputeRequested } from "@/inngest/client";
import { refreshIntentMetricRowsForEmployee } from "@/lib/intent/recategorize";

export const metricRecompute = inngest.createFunction(
  {
    id: "metric-recompute",
    retries: 0,
    triggers: [metricsRecomputeRequested],
  },
  async ({ event, step }) => {
    const metricsRecomputed = await step.run("refresh-intent-metrics", () =>
      refreshIntentMetricRowsForEmployee(event.data.employeeId),
    );
    return { employeeId: event.data.employeeId, metricsRecomputed };
  },
);
