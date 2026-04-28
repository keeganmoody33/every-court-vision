import type { IntentClass, Platform, ShotOutcome } from "@/lib/types";
import { OUT_OF_BOUNDS, PASS_LANES, SHOT_ZONES, type Rect } from "@/lib/intent/zones";

export interface Coord {
  x: number;
  y: number;
  zone: string;
}

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chooseRegion<T extends Record<string, Rect>>(seed: number, regions: T): [keyof T & string, Rect] {
  const entries = Object.entries(regions) as [keyof T & string, Rect][];
  if (entries.length === 0) {
    throw new Error("chooseRegion: regions is empty");
  }
  return entries[(seed >>> 16) % entries.length];
}

function jitter(rect: Rect, seed: number): Pick<Coord, "x" | "y"> {
  const random = mulberry32(seed);
  const r1 = random();
  const r2 = random();
  const xSpan = Math.max(0, rect.xMax - rect.xMin - 2);
  const ySpan = Math.max(0, rect.yMax - rect.yMin - 2);
  return {
    x: Number((rect.xMin + 1 + r1 * xSpan).toFixed(2)),
    y: Number((rect.yMin + 1 + r2 * ySpan).toFixed(2)),
  };
}

export function postToCoord(
  postId: string,
  employeeId: string,
  intentClass: IntentClass,
  outcome: ShotOutcome,
  platform: Platform,
): Coord {
  const seed = fnv1a(`${postId}:${employeeId}:${intentClass}:${platform}`);

  if (outcome === "turnover") {
    const [name, rect] = chooseRegion(seed, OUT_OF_BOUNDS);
    return { ...jitter(rect, seed), zone: `outOfBounds.${name}` };
  }

  if (intentClass === "pass") {
    const [name, rect] = chooseRegion(seed, PASS_LANES);
    return { ...jitter(rect, seed), zone: `pass.${name}` };
  }

  if (intentClass === "threePoint") {
    const [name, rect] = chooseRegion(seed, SHOT_ZONES.threePoint);
    return { ...jitter(rect, seed), zone: `threePoint.${name}` };
  }

  if (intentClass === "midRange") {
    const [name, rect] = chooseRegion(seed, SHOT_ZONES.midRange);
    return { ...jitter(rect, seed), zone: `midRange.${name}` };
  }

  const rect = SHOT_ZONES[intentClass];
  if (!rect) {
    throw new Error(`postToCoord: unknown intentClass "${intentClass}"`);
  }
  return { ...jitter(rect, seed), zone: intentClass };
}
