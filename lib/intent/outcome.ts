import { scoringThresholds } from "@/lib/constants";
import { scoreForMode, shotOutcome } from "@/lib/scoring";
import { TURNOVER_SIGNALS } from "@/lib/intent/keywords";
import type { IntentClass, PostMetrics, PostScores, ScoringMode, ShotOutcome } from "@/lib/types";

export interface OutcomeResult {
  outcome: ShotOutcome;
  recovered: boolean;
}

export interface OutcomePost {
  text: string;
  metrics: PostMetrics;
  scores: PostScores;
}

function dominantMode(post: Pick<OutcomePost, "metrics" | "scores">, modes: ScoringMode[]): ScoringMode {
  if (modes.length === 0) {
    throw new Error("dominantMode: no scoring modes provided");
  }
  return modes
    .map((mode) => ({
      mode,
      ratio: scoreForMode(post, mode) / Math.max(1, scoringThresholds[mode]),
    }))
    .sort((a, b) => b.ratio - a.ratio)[0].mode;
}

export function classifyOutcome(post: OutcomePost, intentClass: IntentClass): OutcomeResult {
  if (intentClass === "pass") return { outcome: "missed", recovered: false };

  const lower = post.text.toLowerCase();
  if (TURNOVER_SIGNALS.some((signal) => lower.includes(signal))) {
    return { outcome: "turnover", recovered: false };
  }

  const mode =
    intentClass === "threePoint"
      ? dominantMode(post, ["Revenue", "Paid Subs", "Consulting Leads"])
      : intentClass === "midRange"
        ? "Signups"
        : intentClass === "paint"
          ? "Engagement"
          : "Trust";
  const outcome = shotOutcome(post, mode) === "make" ? "made" : "missed";
  return {
    outcome,
    recovered: outcome === "missed" && post.metrics.profileVisits > post.metrics.likes,
  };
}
