"use client";

// HEURISTIC:
// Phase 3b has no schema-backed assister -> assisted-shot edge. ShotPlot infers
// a conservative visual pair from an `isAssist` post to the next visible made
// shot within 72h for the same employee or visible roster. This component only
// renders that inferred edge; dashed styling signals that it is not measured.

import { motion } from "framer-motion";

import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import type { Platform } from "@/lib/types";

export interface AssistArcProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPlatform: Platform;
  toPlatform: Platform;
  converted: boolean;
  delay?: number;
}

export function AssistArc({
  fromX,
  fromY,
  toX,
  toY,
  fromPlatform,
  toPlatform,
  converted,
  delay = 0,
}: AssistArcProps) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy) || 1;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const perpendicularX = -dy / distance;
  const perpendicularY = dx / distance;
  const bow = distance * 0.25;
  const controlX = midX + perpendicularX * bow;
  const controlY = Math.min(midY + perpendicularY * bow, midY - bow * 0.35);
  const path = `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${toX.toFixed(2)} ${toY.toFixed(2)}`;

  return (
    <g className="pointer-events-none">
      <motion.path
        d={path}
        fill="none"
        stroke={PLATFORM_COLORS[fromPlatform]}
        strokeWidth={converted ? 1.4 : 1}
        strokeOpacity={converted ? 1 : 0.6}
        strokeDasharray="2 1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: converted ? 1 : 0.6 }}
        transition={{ duration: 0.6, delay }}
      />
      <circle cx={fromX} cy={fromY} r={0.8} fill={PLATFORM_COLORS[fromPlatform]} opacity={0.85} />
      <circle
        cx={toX}
        cy={toY}
        r={1}
        fill={PLATFORM_COLORS[toPlatform]}
        filter={converted ? "url(#strongGlow)" : undefined}
      />
    </g>
  );
}
