import { inngest, metricsRecomputeRequested, postsRecategorizeRequested } from "@/inngest/client";
import { recategorizeForEmployee } from "@/lib/intent/recategorize";

export const recategorizePosts = inngest.createFunction(
  {
    id: "recategorize-posts",
    retries: 0,
    triggers: [postsRecategorizeRequested],
  },
  async ({ event, step }) => {
    const result = await step.run("recategorize-for-employee", () =>
      recategorizeForEmployee(event.data.employeeId),
    );
    await step.sendEvent(
      "trigger-metric-recompute",
      metricsRecomputeRequested.create({ employeeId: event.data.employeeId }),
    );
    return result;
  },
);
