export interface Rect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const SHOT_ZONES = {
  threePoint: {
    leftWing: { xMin: 5, xMax: 23, yMin: 60, yMax: 90 },
    topOfKey: { xMin: 30, xMax: 70, yMin: 58, yMax: 70 },
    rightWing: { xMin: 77, xMax: 95, yMin: 60, yMax: 90 },
  },
  midRange: {
    leftElbow: { xMin: 24, xMax: 38, yMin: 70, yMax: 88 },
    rightElbow: { xMin: 62, xMax: 76, yMin: 70, yMax: 88 },
    topElbow: { xMin: 38, xMax: 62, yMin: 70, yMax: 80 },
  },
  paint: { xMin: 38, xMax: 62, yMin: 80, yMax: 91 },
  freeThrow: { xMin: 44, xMax: 56, yMin: 78, yMax: 82 },
} as const;

export const PASS_LANES = {
  left: { xMin: 4, xMax: 30, yMin: 30, yMax: 60 },
  right: { xMin: 70, xMax: 96, yMin: 30, yMax: 60 },
  top: { xMin: 30, xMax: 70, yMin: 12, yMax: 30 },
} as const;

export const OUT_OF_BOUNDS = {
  topRim: { xMin: 2, xMax: 98, yMin: 0, yMax: 4 },
  bottomRim: { xMin: 2, xMax: 98, yMin: 92, yMax: 94 },
  leftRim: { xMin: 0, xMax: 4, yMin: 4, yMax: 92 },
  rightRim: { xMin: 96, xMax: 100, yMin: 4, yMax: 92 },
} as const;
