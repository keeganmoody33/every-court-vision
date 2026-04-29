import assert from "node:assert/strict";

import { createRecategorizer } from "@/lib/intent/recategorizeCore";

async function run() {
  process.env.OPENAI_API_KEY = "test";

  let inTx = false;
  let llmCalledInTx = false;
  let metricRecomputeCalls = 0;

  const recategorize = createRecategorizer({
    findCandidates: async () => [
      // eligible
      {
        id: "p1",
        employeeId: "e1",
        platform: "X",
        text: "text",
        employee: { name: "A", role: "B" },
        metrics: { views: 1, reach: 1, likes: 0, comments: 0, replies: 0, reposts: 0, quotes: 0, shares: 0, clicks: 0, profileVisits: 0, signups: 0, paidSubscriptions: 0, consultingLeads: 0, revenue: 0, assistedConversions: 0 },
        scores: { awareness: 0, engagement: 0, trust: 0, clicks: 0, signups: 0, paid: 0, consulting: 0, revenue: 0, assists: 0, surfaceIQ: 0, socialTS: 0, assistRate: 0, trustGravity: 0, humanHalo: 0 },
      },
    ],
    classifyIntentWithLLM: async () => {
      if (inTx) llmCalledInTx = true;
      return { intentClass: "pass", intentConfidence: 0.9, signals: ["llm"], isAssist: false, source: "llm" };
    },
    transaction: async (ops) => {
      inTx = true;
      const out = await ops();
      inTx = false;
      return out;
    },
    updatePost: async () => ({ count: 0 }),
    metricUpsertsForEmployee: async () => {
      metricRecomputeCalls += 1;
      return [];
    },
  });

  const result = await recategorize.recategorizeForEmployee("e1");
  assert.equal(llmCalledInTx, false);
  assert.equal(result.refined, 1);
  assert.equal(result.metricsRecomputed, 0);
  assert.equal(metricRecomputeCalls, 0);

  console.log("recategorizeEnabledSafety.smoke.ts passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

