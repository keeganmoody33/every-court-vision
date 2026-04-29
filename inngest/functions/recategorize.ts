import { inngest } from "@/inngest/client";
import { recategorizeForEmployee } from "@/lib/intent/recategorize";

export const recategorize = inngest.createFunction(
  {
    id: "recategorize-posts",
    concurrency: { limit: 2, key: "event.data.employeeId" },
    retries: 1,
  },
  { event: "acquisition/posts.recategorize-requested" },
  async ({ event, step }) => {
    const { employeeId } = event.data as { employeeId: string | null };
    if (!employeeId) return { ok: false, reason: "no_employee_id" };

    const result = await step.run("recategorize", () =>
      recategorizeForEmployee(employeeId),
    );

    await step.sendEvent("trigger-metric-recompute", {
      name: "acquisition/metrics.recompute-requested",
      data: { employeeId },
    });

    return { ok: true, employeeId, result };
  },
);
