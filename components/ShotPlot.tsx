"use client";

import { useState } from "react";
import { scaleSqrt } from "d3";
import { motion } from "framer-motion";

import { CourtCanvas } from "@/components/CourtCanvas";
import { SidePanel } from "@/components/SidePanel";
import { Card, CardContent } from "@/components/ui/card";
import { employeeById } from "@/lib/mockData";
import { shotOutcome } from "@/lib/scoring";
import type { Post, ScoringMode } from "@/lib/types";

export function ShotPlot({ posts, scoringMode }: { posts: Post[]; scoringMode: ScoringMode }) {
  const [selectedPost, setSelectedPost] = useState<Post | undefined>();
  const size = scaleSqrt()
    .domain([0, Math.max(1, ...posts.map((post) => post.metrics.reach))])
    .range([2.3, 7.8]);

  return (
    <>
      <Card className="border-white/10 bg-black/25">
        <CardContent className="p-4">
          <div className="relative h-[420px]">
            <CourtCanvas>
              {posts.map((post, index) => {
                const outcome = shotOutcome(post, scoringMode);
                const radius = size(post.metrics.reach);
                const glow = post.metrics.assistedConversions > 100;
                const employee = employeeById[post.employeeId];

                return (
                  <motion.g
                    key={post.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="pointer-events-none"
                  >
                    <title>{`${employee?.name}: ${post.text}`}</title>
                    {glow ? (
                      <circle cx={post.x} cy={post.y} r={radius + 4} fill="rgba(183,140,255,0.2)" filter="url(#softGlow)" />
                    ) : null}
                    {outcome === "miss" ? (
                      <g stroke="#ff5a66" strokeWidth="1.4" strokeLinecap="round">
                        <line x1={post.x - radius} x2={post.x + radius} y1={post.y - radius} y2={post.y + radius} />
                        <line x1={post.x + radius} x2={post.x - radius} y1={post.y - radius} y2={post.y + radius} />
                      </g>
                    ) : (
                      <circle
                        cx={post.x}
                        cy={post.y}
                        r={radius}
                        fill={outcome === "assist" ? "transparent" : "#55a7ff"}
                        stroke={outcome === "assist" ? "#b78cff" : "white"}
                        strokeWidth={outcome === "assist" ? 1.7 : 0.55}
                      />
                    )}
                    <text x={post.x} y={post.y - radius - 2.2} textAnchor="middle" className="pointer-events-none fill-white/80 text-[2px] font-mono">
                      {employee?.name.split(" ")[0]}
                    </text>
                  </motion.g>
                );
              })}
            </CourtCanvas>
            {posts.map((post) => {
              const employee = employeeById[post.employeeId];
              return (
                <button
                  key={`${post.id}-hit`}
                  type="button"
                  data-testid={`shot-${post.id}`}
                  aria-label={`Open ${employee?.name ?? "employee"} post details`}
                  className="absolute z-20 size-8 -translate-x-1/2 -translate-y-1/2 scroll-mt-96 cursor-pointer rounded-full bg-white/0 outline-none ring-primary/60 transition hover:bg-white/5 focus-visible:ring-2"
                  style={{ left: `${post.x}%`, top: `${(post.y / 94) * 100}%` }}
                  onClick={() => setSelectedPost(post)}
                  onPointerDown={() => setSelectedPost(post)}
                  onFocus={() => setSelectedPost(post)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
      <SidePanel post={selectedPost} open={Boolean(selectedPost)} onOpenChange={(open) => !open && setSelectedPost(undefined)} scoringMode={scoringMode} />
    </>
  );
}
