"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { GamebreakerCallout, MiniHudChip } from "@/components/ArcadeChrome";
import { AssistArc } from "@/components/AssistArc";
import { CourtCanvas } from "@/components/CourtCanvas";
import { PassingLane } from "@/components/PassingLane";
import { SidePanel } from "@/components/SidePanel";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import { recencyVisual } from "@/lib/intent/recency";
import type { Employee, Play, Post, RippleEvent, ScoringMode } from "@/lib/types";

const ASSIST_WINDOW_MS = 72 * 60 * 60 * 1000;

function passLane(post: Post): "left" | "right" | "top" {
  if (post.zone.includes("left")) return "left";
  if (post.zone.includes("right")) return "right";
  return "top";
}

function shotRadius(post: Post) {
  const visual = recencyVisual(post.timestamp);
  return visual.size * (post.intentClass === "threePoint" ? 1.3 : 1);
}

function xMark({
  x,
  y,
  radius,
  color,
  opacity,
}: {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}) {
  return (
    <g stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity={opacity}>
      <line x1={x - radius} x2={x + radius} y1={y - radius} y2={y + radius} />
      <line x1={x + radius} x2={x - radius} y1={y - radius} y2={y + radius} />
    </g>
  );
}

export function ShotPlot({
  posts,
  scoringMode,
  employeeMap,
  playMap,
  rippleEvents,
}: {
  posts: Post[];
  scoringMode: ScoringMode;
  employeeMap: Record<string, Employee>;
  playMap: Record<string, Play>;
  rippleEvents: RippleEvent[];
}) {
  const [selectedPost, setSelectedPost] = useState<Post | undefined>();

  const passPostsByLane = useMemo(() => {
    const lanes: Record<"left" | "right" | "top", Post[]> = { left: [], right: [], top: [] };
    for (const post of posts) {
      if (post.intentClass === "pass") lanes[passLane(post)].push(post);
    }
    return lanes;
  }, [posts]);

  const assistPairs = useMemo(() => {
    const shots = posts
      .filter((post) => post.outcome === "made" && post.intentClass !== "pass")
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    return posts
      .filter((post) => post.isAssist)
      .flatMap((assist) => {
        const assistTime = Date.parse(assist.timestamp);
        if (Number.isNaN(assistTime)) return [];

        const candidates = shots
          .filter((shot) => {
            if (shot.id === assist.id) return false;
            const shotTime = Date.parse(shot.timestamp);
            if (Number.isNaN(shotTime)) return false;
            const delta = shotTime - assistTime;
            return delta > 0 && delta <= ASSIST_WINDOW_MS;
          })
          .sort((a, b) => {
            const aDelta = Date.parse(a.timestamp) - assistTime;
            const bDelta = Date.parse(b.timestamp) - assistTime;
            if (aDelta !== bDelta) return aDelta - bDelta;
            if (a.employeeId === assist.employeeId && b.employeeId !== assist.employeeId) return -1;
            if (b.employeeId === assist.employeeId && a.employeeId !== assist.employeeId) return 1;
            return 0;
          });

        const target = candidates[0];
        return target ? [{ assist, target }] : [];
      });
  }, [posts]);

  const madeShots = posts.filter((post) => post.outcome === "made").length;
  const missedShots = posts.filter((post) => post.outcome === "missed").length;
  const selectedEmployee = selectedPost ? employeeMap[selectedPost.employeeId]?.name ?? "Roster" : "None";

  return (
    <>
      <Card className="border-arcade-cyan/20 bg-black/35">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <MiniHudChip label="Mode" value={scoringMode} tone="teal" />
              <MiniHudChip label="Made" value={String(madeShots)} tone="orange" />
              <MiniHudChip label="Miss" value={String(missedShots)} tone="red" />
              <MiniHudChip label="Focus" value={selectedEmployee} tone="purple" />
            </div>
            {assistPairs.length >= 3 ? (
              <div className="w-full sm:w-[280px]">
                <GamebreakerCallout
                  level={2}
                  label="Assist Combo"
                  detail={`${assistPairs.length} conservative assist arcs are visible in this window.`}
                  active
                />
              </div>
            ) : null}
          </div>
          <div className="relative h-[420px]">
            <CourtCanvas>
              {(["left", "right", "top"] as const).map((lane) => (
                <PassingLane
                  key={lane}
                  lane={lane}
                  posts={passPostsByLane[lane].map((post) => ({
                    id: post.id,
                    x: post.x,
                    y: post.y,
                    platform: post.platform,
                    publishedAt: post.timestamp,
                  }))}
                />
              ))}

              {posts.map((post, index) => {
                if (post.intentClass === "pass") return null;
                const radius = shotRadius(post);
                const visual = recencyVisual(post.timestamp);
                const platformColor = PLATFORM_COLORS[post.platform];
                const glow = post.metrics.assistedConversions > 100;
                const employee = employeeMap[post.employeeId];
                const selected = selectedPost?.id === post.id;

                return (
                  <motion.g
                    key={post.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="pointer-events-none"
                  >
                    <title>{`${employee?.name}: ${post.text}`}</title>
                    {post.outcome === "made" ? (
                      <circle
                        cx={post.x}
                        cy={post.y}
                        r={radius}
                        fill={platformColor}
                        fillOpacity={selected ? 1 : visual.opacity}
                        stroke="white"
                        strokeOpacity={selected ? 0.95 : 0.5}
                        strokeWidth={selected ? 1.15 : 0.55}
                        filter={glow || selected ? "url(#softGlow)" : undefined}
                      />
                    ) : post.outcome === "missed" ? (
                      xMark({ x: post.x, y: post.y, radius: selected ? radius * 1.25 : radius, color: platformColor, opacity: selected ? 1 : visual.opacity })
                    ) : (
                      xMark({
                        x: post.x,
                        y: post.y,
                        radius: Math.max(1.2, radius),
                        color: "hsl(var(--muted-foreground))",
                        opacity: 0.4,
                      })
                    )}
                  </motion.g>
                );
              })}

              {assistPairs.map(({ assist, target }, index) => (
                <AssistArc
                  key={`${assist.id}-${target.id}`}
                  fromX={assist.x}
                  fromY={assist.y}
                  toX={target.x}
                  toY={target.y}
                  fromPlatform={assist.platform}
                  toPlatform={target.platform}
                  converted
                  delay={index * 0.04}
                />
              ))}
            </CourtCanvas>
            {posts.map((post) => {
              const employee = employeeMap[post.employeeId];
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
      <SidePanel
        post={selectedPost}
        open={Boolean(selectedPost)}
        onOpenChange={(open) => !open && setSelectedPost(undefined)}
        scoringMode={scoringMode}
        employeeMap={employeeMap}
        playMap={playMap}
        rippleEvents={rippleEvents}
      />
    </>
  );
}
