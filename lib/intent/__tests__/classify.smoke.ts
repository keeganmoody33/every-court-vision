import assert from "node:assert/strict";

import { classifyIntent } from "@/lib/intent/classify";
import type { Platform } from "@/lib/types";

const cases: {
  text: string;
  name: string;
  platform: Platform;
  intentClass: ReturnType<typeof classifyIntent>["intentClass"];
  minConfidence: number;
  isAssist?: boolean;
}[] = [
  { text: "Book a demo: every.to/consulting", name: "Austin", platform: "X", intentClass: "threePoint", minConfidence: 0.85 },
  { text: "Sign up for the every newsletter", name: "Dan", platform: "X", intentClass: "midRange", minConfidence: 0.8 },
  { text: "Follow @every for daily AI essays", name: "Kate", platform: "X", intentClass: "paint", minConfidence: 0.75 },
  { text: "Missing the old ESPN NBA Countdown crew", name: "Austin", platform: "X", intentClass: "freeThrow", minConfidence: 0.7 },
  { text: "1/ Here's how I think about agent UI", name: "Kieran", platform: "X", intentClass: "pass", minConfidence: 0.7 },
  { text: "Try Spiral free for 14 days", name: "Dan", platform: "X", intentClass: "midRange", minConfidence: 0.8 },
  { text: "Mumbai street food > SF sourdough", name: "Yash", platform: "X", intentClass: "freeThrow", minConfidence: 0.7 },
  {
    text: "@danshipper great piece on autopilot",
    name: "Naveen",
    platform: "X",
    intentClass: "pass",
    minConfidence: 0.7,
    isAssist: true,
  },
  { text: "We burned a billion tokens. Try Sparkle now.", name: "Yash", platform: "X", intentClass: "threePoint", minConfidence: 0.85 },
  { text: "The future of software UI is conversational", name: "Kieran", platform: "X", intentClass: "pass", minConfidence: 0.7 },
  { text: "Voice notes are underrated for creative work", name: "Naveen", platform: "X", intentClass: "pass", minConfidence: 0.55 },
];

for (const item of cases) {
  const result = classifyIntent(item.text, { name: item.name, role: "Operator", platform: item.platform });
  assert.equal(result.intentClass, item.intentClass, item.text);
  assert.ok(result.intentConfidence >= item.minConfidence, item.text);
  if (item.isAssist !== undefined) assert.equal(result.isAssist, item.isAssist, item.text);
}

console.log(`classify.smoke.ts passed ${cases.length} cases`);
process.exit(0);
