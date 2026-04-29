import assert from "node:assert/strict";

import { computeIntentMetrics } from "@/lib/intent/metrics";
import type { PostMetrics } from "@/lib/types";

async function run() {
  const metrics: PostMetrics = {
    views: 100,
    reach: 100,
    likes: 10,
    comments: 1,
    replies: 1,
    reposts: 1,
    quotes: 0,
    shares: 1,
    clicks: 2,
    profileVisits: 3,
    signups: 1,
    paidSubscriptions: 0,
    consultingLeads: 0,
    revenue: 0,
    assistedConversions: 0,
  };

  const out = computeIntentMetrics(
    [
      // Turnover outcome can occur for a non-pass intent class.
      { brandTouch: "Every", isAssist: false, intentClass: "threePoint", outcome: "turnover", metrics },
      { brandTouch: "Every", isAssist: false, intentClass: "paint", outcome: "missed", metrics },
      { brandTouch: "Every", isAssist: false, intentClass: "pass", outcome: "missed", metrics },
    ],
    7,
  );

  // This test is intentionally shaped to surface the overlap (turnover inside FGA).
  assert.equal(out.turnovers, 1);
  assert.equal(out.threePtAttempts, 1);
  assert.equal(out.paintAttempts, 1);
  assert.equal(out.passes, 1);
  assert.equal(out.totalAttempts, 2);

  console.log("metricsTurnoverDoubleCount.smoke.ts passed", out.totalAttempts, out.pacePerWeek);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

