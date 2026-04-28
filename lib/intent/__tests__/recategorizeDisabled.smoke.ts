import assert from "node:assert/strict";

import { createRecategorizer } from "@/lib/intent/recategorizeCore";

async function run() {
  delete process.env.OPENAI_API_KEY;

  let calledLlm = 0;
  let calledTransaction = 0;
  let calledMetricUpserts = 0;

  const recategorize = createRecategorizer({
    classifyIntentWithLLM: async () => {
      calledLlm += 1;
      return null;
    },
    transaction: async () => {
      calledTransaction += 1;
      return [];
    },
    metricUpsertsForEmployee: async () => {
      calledMetricUpserts += 1;
      return [];
    },
    findCandidates: async () => [
      {
        id: "post-1",
        employeeId: "emp-1",
        platform: "X",
        text: "hello",
        employee: { name: "A", role: "B" },
        metrics: { views: 1, reach: 1, likes: 0, comments: 0, replies: 0, reposts: 0, quotes: 0, shares: 0, clicks: 0, profileVisits: 0, signups: 0, paidSubscriptions: 0, consultingLeads: 0, revenue: 0, assistedConversions: 0 },
        scores: { awareness: 0, engagement: 0, trust: 0, clicks: 0, signups: 0, paid: 0, consulting: 0, revenue: 0, assists: 0, surfaceIQ: 0, socialTS: 0, assistRate: 0, trustGravity: 0, humanHalo: 0 },
      },
    ],
  });

  const result = await recategorize.recategorizeForEmployee("emp-1");
  assert.equal(result.posts, 1);
  assert.equal(result.refined, 0);
  assert.equal(result.metricsRecomputed, 0);
  assert.equal(calledLlm, 0);
  assert.equal(calledTransaction, 0);
  assert.equal(calledMetricUpserts, 0);

  console.log("recategorizeDisabled.smoke.ts passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

