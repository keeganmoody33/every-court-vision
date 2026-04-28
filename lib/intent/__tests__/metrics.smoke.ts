import assert from "node:assert/strict";

import { computeIntentMetrics } from "@/lib/intent/metrics";
import type { PostMetrics } from "@/lib/types";

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

const before = computeIntentMetrics(
  [
    { brandTouch: "Every", isAssist: false, intentClass: "pass", outcome: "missed", metrics },
    { brandTouch: "Every", isAssist: false, intentClass: "pass", outcome: "missed", metrics },
  ],
  30,
);
const after = computeIntentMetrics(
  [
    { brandTouch: "Every", isAssist: false, intentClass: "threePoint", outcome: "made", metrics },
    { brandTouch: "Personal", isAssist: true, intentClass: "midRange", outcome: "missed", metrics },
  ],
  30,
);

assert.equal(before.passes, 2);
assert.equal(before.threePtPct, 0);
assert.equal(after.passes, 0);
assert.equal(after.threePtPct, 100);
assert.equal(after.assistsCreated, 1);
assert.notEqual(before.fgPct, after.fgPct);

console.log("metrics.smoke.ts passed");
process.exit(0);
