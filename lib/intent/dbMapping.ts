import type { IntentClass, ShotOutcome } from "@/lib/types";

export type DbIntentClass = "THREE_POINT" | "MID_RANGE" | "PAINT" | "FREE_THROW" | "PASS";
export type DbShotOutcome = "MADE" | "MISSED" | "TURNOVER";

export const intentClassToDb: Record<IntentClass, DbIntentClass> = {
  threePoint: "THREE_POINT",
  midRange: "MID_RANGE",
  paint: "PAINT",
  freeThrow: "FREE_THROW",
  pass: "PASS",
};

export const intentClassFromDb: Record<DbIntentClass, IntentClass> = {
  THREE_POINT: "threePoint",
  MID_RANGE: "midRange",
  PAINT: "paint",
  FREE_THROW: "freeThrow",
  PASS: "pass",
};

export const shotOutcomeToDb: Record<ShotOutcome, DbShotOutcome> = {
  made: "MADE",
  missed: "MISSED",
  turnover: "TURNOVER",
};

export const shotOutcomeFromDb: Record<DbShotOutcome, ShotOutcome> = {
  MADE: "made",
  MISSED: "missed",
  TURNOVER: "turnover",
};
