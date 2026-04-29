import assert from "node:assert/strict";

import { recencyVisual } from "@/lib/intent/recency";

const now = new Date("2026-04-28T12:00:00.000Z");

assert.deepEqual(recencyVisual(now.toISOString(), now), { size: 1.6, opacity: 1 });
assert.deepEqual(recencyVisual("2026-04-20T12:00:00.000Z", now), { size: 1.2, opacity: 0.7 });
assert.deepEqual(recencyVisual("2026-01-18T12:00:00.000Z", now), { size: 0.6, opacity: 0.3 });
assert.deepEqual(recencyVisual("2026-05-01T12:00:00.000Z", now), { size: 1.6, opacity: 1 });

const invalid = recencyVisual("not-a-date", now);
assert.ok(invalid.size >= 0);
assert.ok(invalid.opacity >= 0);

console.log("recency.smoke.ts passed");
process.exit(0);
