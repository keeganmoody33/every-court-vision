"use client";

import { curveBasis, line } from "d3";
import { motion } from "framer-motion";

import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import { recencyVisual } from "@/lib/intent/recency";
import type { Platform } from "@/lib/types";

export interface PassingLanePost {
  id: string;
  x: number;
  y: number;
  platform: Platform;
  publishedAt: string;
}

export interface PassingLaneProps {
  posts: PassingLanePost[];
  lane: "left" | "right" | "top";
}

export function PassingLane({ posts, lane }: PassingLaneProps) {
  const ordered = [...posts].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
  const path =
    ordered.length >= 2
      ? line<PassingLanePost>()
          .x((post) => post.x)
          .y((post) => post.y)
          .curve(curveBasis)(ordered)
      : undefined;

  return (
    <g data-lane={lane} className="pointer-events-none">
      {path ? (
        <motion.path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={0.6}
          strokeDasharray="1.5 1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      ) : null}
      {ordered.map((post) => {
        const visual = recencyVisual(post.publishedAt);
        return (
          <circle
            key={post.id}
            cx={post.x}
            cy={post.y}
            r={1.2}
            fill="none"
            stroke={PLATFORM_COLORS[post.platform]}
            strokeWidth={0.7}
            opacity={visual.opacity}
          />
        );
      })}
    </g>
  );
}
