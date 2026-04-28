import type { IntentClass, Platform } from "@/lib/types";
import {
  ASSIST_SIGNALS,
  FREE_THROW_SIGNALS,
  MID_RANGE_SIGNALS,
  PAINT_SIGNALS,
  PASS_SIGNALS,
  THREE_POINT_SIGNALS,
  WORK_SIGNALS,
} from "@/lib/intent/keywords";

export interface IntentContext {
  name: string;
  role: string;
  platform: Platform;
}

export interface IntentResult {
  intentClass: IntentClass;
  intentConfidence: number;
  signals: string[];
  isAssist: boolean;
  source: "keyword" | "llm";
}

function matchingSignals(text: string, prefix: string, signals: string[]) {
  return signals.filter((signal) => text.includes(signal)).map((signal) => `${prefix}:${signal}`);
}

function hasSignal(text: string, signal: string) {
  if (/^[a-z0-9]+$/.test(signal)) {
    return new RegExp(`\\b${signal}\\b`, "i").test(text);
  }
  return text.includes(signal);
}

function confidence(base: number, matchCount: number, cap = 0.95) {
  return Math.min(cap, Number((base + 0.05 * Math.max(0, matchCount - 1)).toFixed(2)));
}

export function classifyIntent(text: string, _ctx: IntentContext): IntentResult {
  const lower = text.toLowerCase();
  const assistSignals = matchingSignals(lower, "assist", ASSIST_SIGNALS);
  const isAssist = assistSignals.length > 0;

  const threePointSignals = matchingSignals(lower, "3P", THREE_POINT_SIGNALS);
  if (threePointSignals.length) {
    return {
      intentClass: "threePoint",
      intentConfidence: confidence(0.85, threePointSignals.length),
      signals: [...threePointSignals, ...assistSignals],
      isAssist,
      source: "keyword",
    };
  }

  const midRangeSignals = matchingSignals(lower, "mid", MID_RANGE_SIGNALS);
  if (midRangeSignals.length) {
    return {
      intentClass: "midRange",
      intentConfidence: 0.8,
      signals: [...midRangeSignals, ...assistSignals],
      isAssist,
      source: "keyword",
    };
  }

  const paintSignals = matchingSignals(lower, "paint", PAINT_SIGNALS);
  if (paintSignals.length) {
    return {
      intentClass: "paint",
      intentConfidence: 0.75,
      signals: [...paintSignals, ...assistSignals],
      isAssist,
      source: "keyword",
    };
  }

  const passSignals = matchingSignals(lower, "pass", PASS_SIGNALS);
  if (passSignals.length || isAssist) {
    return {
      intentClass: "pass",
      intentConfidence: passSignals.length ? 0.7 : 0.7,
      signals: [...passSignals, ...assistSignals],
      isAssist,
      source: "keyword",
    };
  }

  const hasWorkSignal = WORK_SIGNALS.some((signal) => hasSignal(lower, signal));
  const freeThrowSignals = matchingSignals(lower, "FT", FREE_THROW_SIGNALS);
  if (freeThrowSignals.length && !hasWorkSignal) {
    return {
      intentClass: "freeThrow",
      intentConfidence: 0.75,
      signals: freeThrowSignals,
      isAssist,
      source: "keyword",
    };
  }

  if (hasWorkSignal) {
    return {
      intentClass: "pass",
      intentConfidence: 0.55,
      signals: ["default:work_signal"],
      isAssist,
      source: "keyword",
    };
  }

  return {
    intentClass: "freeThrow",
    intentConfidence: 0.5,
    signals: ["default:no_signals"],
    isAssist,
    source: "keyword",
  };
}
