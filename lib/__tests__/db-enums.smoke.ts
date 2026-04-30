import assert from "node:assert/strict";

import {
  AcquisitionJobStatus,
  AcquisitionProvider,
  DataReadiness,
  IntentClass,
  MetricConfidence,
  Platform,
  ShotOutcome,
  SourceReadiness,
} from "@/lib/db-enums";

// Each enum's runtime values must exactly match the schema.sql enum
// definitions (db/schema.sql is canonical). The expected sets below are
// hand-mirrored; if they drift, callsites that bind enum values into SQL
// will fail with `invalid input value for enum`. This test catches that
// before runtime.

function expectSet(name: string, actual: Record<string, string>, expected: string[]) {
  const actualValues = Object.values(actual).sort();
  const expectedSorted = [...expected].sort();
  assert.deepEqual(
    actualValues,
    expectedSorted,
    `${name} runtime values must match schema.sql`,
  );
  for (const value of expected) {
    assert.equal(actual[value], value, `${name}.${value} must equal "${value}"`);
  }
}

expectSet("AcquisitionJobStatus", AcquisitionJobStatus, [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "PARTIAL",
  "FAILED",
  "DISABLED",
  "DEAD_LETTER",
]);

expectSet("AcquisitionProvider", AcquisitionProvider, [
  "X_API",
  "LINKEDIN_API",
  "GITHUB_API",
  "YOUTUBE_API",
  "RSS",
  "SPIDER",
  "PARALLEL",
  "MANUAL",
  "INSTAGRAM_GRAPH",
]);

expectSet("DataReadiness", DataReadiness, ["PUBLIC_ONLY", "MANUAL_IMPORT", "LIVE"]);

expectSet("IntentClass", IntentClass, [
  "THREE_POINT",
  "MID_RANGE",
  "PAINT",
  "FREE_THROW",
  "PASS",
]);

expectSet("MetricConfidence", MetricConfidence, [
  "DIRECT",
  "ESTIMATED",
  "MODELED",
  "HYPOTHESIS",
  "NEEDS_INTERNAL_ANALYTICS",
]);

expectSet("Platform", Platform, [
  "X",
  "LINKEDIN",
  "GITHUB",
  "INSTAGRAM",
  "NEWSLETTER",
  "YOUTUBE",
  "PODCAST",
  "LAUNCHES",
  "TEAMMATE_AMPLIFICATION",
  "EXTERNAL_AMPLIFICATION",
  "PRODUCT_HUNT",
  "PERSONAL_SITE",
  "TIKTOK",
  "WEBSITE",
  "SUBSTACK",
  "APP_STORE",
  "REFERRAL",
  "CONSULTING",
]);

expectSet("ShotOutcome", ShotOutcome, ["MADE", "MISSED", "TURNOVER"]);

expectSet("SourceReadiness", SourceReadiness, [
  "READY",
  "MANUAL_IMPORT",
  "NEEDS_OAUTH",
  "FUTURE",
]);

// Type narrowing: a string-literal type alias must accept the const value
// without `as` casts. If this stops compiling, the type alias is wrong.
const status: AcquisitionJobStatus = AcquisitionJobStatus.QUEUED;
assert.equal(status, "QUEUED");

console.log("✓ all 8 db-enums values + types validated");
