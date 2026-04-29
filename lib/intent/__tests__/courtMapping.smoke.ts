import assert from "node:assert/strict";

import { postToCoord } from "@/lib/intent/courtMapping";
import { OUT_OF_BOUNDS, PASS_LANES, SHOT_ZONES, type Rect } from "@/lib/intent/zones";
import type { IntentClass, ShotOutcome } from "@/lib/types";

function inRect(point: { x: number; y: number }, rect: Rect) {
  return point.x >= rect.xMin && point.x <= rect.xMax && point.y >= rect.yMin && point.y <= rect.yMax;
}

function rectForZone(zone: string): Rect {
  const [family, name] = zone.split(".");
  if (family === "threePoint") return SHOT_ZONES.threePoint[name as keyof typeof SHOT_ZONES.threePoint];
  if (family === "midRange") return SHOT_ZONES.midRange[name as keyof typeof SHOT_ZONES.midRange];
  if (family === "pass") return PASS_LANES[name as keyof typeof PASS_LANES];
  if (family === "outOfBounds") return OUT_OF_BOUNDS[name as keyof typeof OUT_OF_BOUNDS];
  if (family === "paint") return SHOT_ZONES.paint;
  if (family === "freeThrow") return SHOT_ZONES.freeThrow;
  throw new Error(`Unknown zone ${zone}`);
}

const first = postToCoord("post-1", "employee-1", "threePoint", "made", "X");
for (let i = 0; i < 100; i += 1) {
  assert.deepEqual(postToCoord("post-1", "employee-1", "threePoint", "made", "X"), first);
}

const intents: IntentClass[] = ["threePoint", "midRange", "paint", "freeThrow", "pass"];
const outcomes: ShotOutcome[] = ["made", "missed", "turnover"];
for (const intent of intents) {
  for (const outcome of outcomes) {
    const coord = postToCoord(`combo-${intent}-${outcome}`, "employee-1", intent, outcome, "LinkedIn");
    assert.ok(coord.zone.length > 0);
    assert.ok(inRect(coord, rectForZone(coord.zone)), coord.zone);
  }
}

for (let i = 0; i < 50; i += 1) {
  const turnover = postToCoord(`turnover-${i}`, "employee-1", "paint", "turnover", "X");
  assert.ok(turnover.zone.startsWith("outOfBounds."));
  assert.ok(inRect(turnover, rectForZone(turnover.zone)));

  const pass = postToCoord(`pass-${i}`, "employee-1", "pass", "missed", "X");
  assert.ok(pass.zone.startsWith("pass."));
  assert.ok(inRect(pass, rectForZone(pass.zone)));
}

const threePointZones = new Map<string, number>();
const threePointPoints = [];
for (let i = 0; i < 100; i += 1) {
  const coord = postToCoord(`three-${i}`, "employee-1", "threePoint", "made", "X");
  threePointZones.set(coord.zone, (threePointZones.get(coord.zone) ?? 0) + 1);
  threePointPoints.push(coord);
}
assert.equal(threePointZones.size, 3);
for (const count of threePointZones.values()) assert.ok(count >= 20 && count <= 45, `3P distribution ${count}`);

const leftWingPoints = threePointPoints.filter((point) => point.zone === "threePoint.leftWing");
assert.ok(
  leftWingPoints.length > 0,
  `Expected at least one leftWing point; got 0. threePointPoints=${threePointPoints.length}`,
);
const leftWing = SHOT_ZONES.threePoint.leftWing;
const widthCoverage =
  (Math.max(...leftWingPoints.map((point) => point.x)) - Math.min(...leftWingPoints.map((point) => point.x))) /
  (leftWing.xMax - leftWing.xMin - 2);
const heightCoverage =
  (Math.max(...leftWingPoints.map((point) => point.y)) - Math.min(...leftWingPoints.map((point) => point.y))) /
  (leftWing.yMax - leftWing.yMin - 2);
assert.ok(widthCoverage >= 0.7, `width coverage ${widthCoverage}`);
assert.ok(heightCoverage >= 0.7, `height coverage ${heightCoverage}`);

console.log("courtMapping.smoke.ts passed");
process.exit(0);
