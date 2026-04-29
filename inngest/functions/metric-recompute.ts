import { inngest } from "@/inngest/client";
import { refreshIntentMetricRowsForEmployee } from "@/lib/intent/recategorize";

export const metricRecompute = inngest.createFunction(
  {
    id: "metric-recompute",
    concurrency: { limit: 3, key: "event.data.employeeId" },
    retries: 1,
  },
  { event: "acquisition/metrics.recompute-requested" },
  async ({ event, step }) => {
    const { employeeId } = event.data as { employeeId: string | null };
    if (!employeeId) return { ok: false, reason: "no_employee_id" };

    const rowsUpdated = await step.run("recompute-metrics", () =>
      refreshIntentMetricRowsForEmployee(employeeId),
    );

    return { ok: true, employeeId, rowsUpdated };
  },
);
