import type { IntentClass, Post, ShotOutcome } from "@/lib/types";

export interface IntentEfficiencyMetrics {
  totalAttempts: number;
  threePtAttempts: number;
  midAttempts: number;
  paintAttempts: number;
  ftAttempts: number;
  passes: number;
  turnovers: number;
  threePtMade: number;
  midMade: number;
  paintMade: number;
  threePtPct: number;
  midPct: number;
  paintPct: number;
  fgPct: number;
  effectiveFgPct: number;
  trueShootingPct: number;
  pacePerWeek: number;
  brandTouchEvery: number;
  brandTouchPersonal: number;
  assistsCreated: number;
}

type IntentPost = Pick<Post, "brandTouch" | "isAssist" | "metrics"> & {
  intentClass: IntentClass;
  outcome: ShotOutcome;
};

function pct(numerator: number, denominator: number) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

export function computeIntentMetrics(posts: IntentPost[], windowDays: number): IntentEfficiencyMetrics {
  const threePtAttempts = posts.filter((post) => post.intentClass === "threePoint").length;
  const midAttempts = posts.filter((post) => post.intentClass === "midRange").length;
  const paintAttempts = posts.filter((post) => post.intentClass === "paint").length;
  const ftAttempts = posts.filter((post) => post.intentClass === "freeThrow").length;
  const passes = posts.filter((post) => post.intentClass === "pass").length;
  const turnovers = posts.filter((post) => post.outcome === "turnover").length;
  const threePtMade = posts.filter((post) => post.intentClass === "threePoint" && post.outcome === "made").length;
  const midMade = posts.filter((post) => post.intentClass === "midRange" && post.outcome === "made").length;
  const paintMade = posts.filter((post) => post.intentClass === "paint" && post.outcome === "made").length;
  const ftMade = posts.filter((post) => post.intentClass === "freeThrow" && post.outcome === "made").length;
  const fga = threePtAttempts + midAttempts + paintAttempts;
  const made = threePtMade + midMade + paintMade;
  const totalAttempts = fga + ftAttempts + turnovers;
  const points = threePtMade * 3 + midMade * 2 + paintMade * 2 + ftMade;
  const trueShootingDenominator = 2 * (fga + 0.44 * ftAttempts);

  return {
    totalAttempts,
    threePtAttempts,
    midAttempts,
    paintAttempts,
    ftAttempts,
    passes,
    turnovers,
    threePtMade,
    midMade,
    paintMade,
    threePtPct: pct(threePtMade, threePtAttempts),
    midPct: pct(midMade, midAttempts),
    paintPct: pct(paintMade, paintAttempts),
    fgPct: pct(made, fga),
    effectiveFgPct: fga ? Number((((threePtMade * 1.5 + midMade + paintMade) / fga) * 100).toFixed(2)) : 0,
    trueShootingPct: trueShootingDenominator ? Number(((points / trueShootingDenominator) * 100).toFixed(2)) : 0,
    pacePerWeek: windowDays ? Number(((totalAttempts / windowDays) * 7).toFixed(2)) : 0,
    brandTouchEvery: pct(posts.filter((post) => post.brandTouch === "Every").length, posts.length),
    brandTouchPersonal: pct(posts.filter((post) => post.brandTouch === "Personal").length, posts.length),
    assistsCreated: posts.filter((post) => post.isAssist).length,
  };
}
