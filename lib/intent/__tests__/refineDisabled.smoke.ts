import assert from "node:assert/strict";

import { createRefineEndpoint } from "@/lib/intent/refineEndpoint";

async function run() {
  delete process.env.OPENAI_API_KEY;

  let calledEmployee = 0;
  let calledAll = 0;

  const endpoint = createRefineEndpoint({
    recategorizeForEmployee: async () => {
      calledEmployee += 1;
      return { posts: 0, llmEscalations: 0, metricsRecomputed: 0, refined: 0, skipped: 0, errors: 0 };
    },
    recategorizeAllLowConfidence: async () => {
      calledAll += 1;
      return { refined: 0, skipped: 0, errors: 0 };
    },
  });

  const res = await endpoint({ employeeId: "emp-1" });
  assert.equal(res.ok, true);
  assert.equal(res.refined, 0);
  if (!("reason" in res)) assert.fail("expected disabled response reason");
  assert.equal(res.reason, "llm_disabled");
  assert.equal(calledEmployee, 0);
  assert.equal(calledAll, 0);

  console.log("refineDisabled.smoke.ts passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
