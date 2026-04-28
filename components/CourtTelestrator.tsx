"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Employee, Post, RippleEvent } from "@/lib/types";

/**
 * CourtTelestrator — the centerpiece. Chalk-on-court view that collapses
 * Court Heat + Shot Plot + Ripple Graph + Stream into a single performing surface.
 *
 * Visual grammar (per brief):
 *  - every.to spine: lives inside an essay <Figure> wrapper, prose is the frame.
 *  - ESPN broadcast: chalk telestrator drawn over a real court diagram.
 *  - hex.tech: big breathing canvas, minimal chrome, eyebrow-title-caption rhythm
 *    (those three live on the wrapping <Figure>; here we own the canvas).
 *  - NBA Street Vol. 2: rare GameBreaker overlay when `gamebreakerLevel > 0`.
 */
export function CourtTelestrator({
  posts,
  rippleEvents,
  employeeMap = {},
  selectedPostId,
  defaultPostId,
  onSelect,
  height = 560,
  compact = false,
  gamebreakerLevel = 0,
  className,
}: {
  posts: Post[];
  rippleEvents: RippleEvent[];
  employeeMap?: Record<string, Employee>;
  selectedPostId?: string;
  /** Initial focus when uncontrolled. Defaults to the post with the most ripple value. */
  defaultPostId?: string;
  onSelect?: (postId: string | undefined) => void;
  height?: number;
  compact?: boolean;
  /** 0 = none, 1 = first viral threshold, 2 = teammate assist confirmed, 3 = full chain. */
  gamebreakerLevel?: 0 | 1 | 2 | 3;
  className?: string;
}) {
  // Auto-pick the most "telestrator-worthy" shot if no selection — the post whose
  // ripple chain has the most total downstream value.
  const ripplesByRoot = useMemo(() => {
    const map = new Map<string, RippleEvent[]>();
    for (const ev of rippleEvents) {
      if (!ev.rootPostId) continue;
      const arr = map.get(ev.rootPostId) ?? [];
      arr.push(ev);
      map.set(ev.rootPostId, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    }
    return map;
  }, [rippleEvents]);

  const autoFocusId = useMemo(() => {
    if (defaultPostId) return defaultPostId;
    let bestId: string | undefined;
    let best = -1;
    for (const [postId, evs] of ripplesByRoot) {
      const score = evs.reduce((s, e) => s + (e.value || 0), 0);
      if (score > best) {
        best = score;
        bestId = postId;
      }
    }
    return bestId ?? posts[0]?.id;
  }, [defaultPostId, posts, ripplesByRoot]);

  const [internalSelected, setInternalSelected] = useState<string | undefined>(autoFocusId);
  const focusId = selectedPostId ?? internalSelected;
  const focusPost = useMemo(() => posts.find((p) => p.id === focusId), [posts, focusId]);
  const focusRipples = useMemo(
    () => (focusId ? (ripplesByRoot.get(focusId) ?? []) : []),
    [focusId, ripplesByRoot],
  );

  // Time scrubber — controls how many ripples have "happened" yet.
  // Reset progress to total whenever the focus changes (canonical "reset on prop change"
  // pattern: track previous prop in render, reset state inline — no useEffect needed).
  const total = focusRipples.length;
  const [progress, setProgress] = useState(total);
  const [prevTotal, setPrevTotal] = useState(total);
  if (prevTotal !== total) {
    setPrevTotal(total);
    setProgress(total);
  }

  const visibleRipples = focusRipples.slice(0, progress);

  const handleSelect = (id: string | undefined) => {
    if (selectedPostId === undefined) setInternalSelected(id);
    onSelect?.(id);
  };

  // SVG canvas geometry. Court is 100x94; pad so chalk strokes can extend off-court.
  const VW = 100;
  const VH = 94;

  // Position ripple endpoints on a fan around the root post.
  const ripplePositions = useMemo(() => {
    if (!focusPost) return [] as { ev: RippleEvent; x: number; y: number; arcId: string }[];
    return focusRipples.map((ev, i) => {
      // Spread around root. Vary radius by index so chains feel organic.
      const angleStart = -Math.PI * 0.65;
      const angleEnd = Math.PI * 0.35;
      const t = focusRipples.length === 1 ? 0.5 : i / (focusRipples.length - 1);
      const angle = angleStart + (angleEnd - angleStart) * t;
      const radius = 18 + (i % 3) * 7 + Math.sin(i * 1.7) * 3;
      let x = focusPost.x + Math.cos(angle) * radius;
      let y = focusPost.y + Math.sin(angle) * radius;
      // Clamp to canvas with margin so labels stay in frame.
      x = Math.max(8, Math.min(VW - 8, x));
      y = Math.max(8, Math.min(VH - 8, y));
      return { ev, x, y, arcId: `arc-${focusPost.id}-${ev.id}` };
    });
  }, [focusPost, focusRipples]);

  return (
    <div className={cn("relative isolate", className)}>
      {/* GameBreaker overlay — rare, only fires when caller passes a level. */}
      {gamebreakerLevel === 1 || gamebreakerLevel === 2 || gamebreakerLevel === 3 ? (
        <GameBreakerOverlay level={gamebreakerLevel} />
      ) : null}

      {/* Top chrome — ticker scoreboard + selection chip */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 pb-3 sm:px-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-eyebrow uppercase tracking-ticker text-court-orange tabular">
            Telestrator · {employeeMap[focusPost?.employeeId ?? ""]?.name ?? "Roster"}
          </span>
          <span className="font-serif italic text-caption text-muted-foreground">
            {focusPost ? focusPost.platform : "—"} · {focusRipples.length} downstream events
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
          <span aria-hidden className="size-1.5 rounded-full bg-confidence-direct animate-pulse" />
          LIVE READING
        </div>
      </div>

      {/* The court canvas */}
      <div
        className="relative overflow-hidden rounded-sm border border-court-line/15 bg-[radial-gradient(circle_at_30%_-10%,rgba(255,157,66,0.06),transparent_55%),radial-gradient(circle_at_75%_120%,rgba(85,167,255,0.05),transparent_60%),hsl(var(--court-paint))]"
        style={{ minHeight: compact ? 320 : height }}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="h-full min-h-[inherit] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="cv-soft-glow">
              <feGaussianBlur stdDeviation="0.7" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="cv-chalk" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
              <feDisplacementMap in="SourceGraphic" scale="0.35" />
            </filter>
            <linearGradient id="cv-paint" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--court-paint))" stopOpacity="0.85" />
              <stop offset="100%" stopColor="hsl(var(--court-wood))" stopOpacity="0.95" />
            </linearGradient>
            <pattern id="cv-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M6 0H0V6" fill="none" stroke="hsl(var(--court-line) / 0.06)" strokeWidth="0.15" />
            </pattern>
          </defs>

          {/* Court substrate */}
          <rect x="0" y="0" width={VW} height={VH} fill="url(#cv-paint)" />
          <rect x="0" y="0" width={VW} height={VH} fill="url(#cv-grid)" />
          <rect
            x="1.5"
            y="1.5"
            width={VW - 3}
            height={VH - 3}
            fill="none"
            stroke="hsl(var(--court-line) / 0.55)"
            strokeWidth="0.35"
          />
          {/* Half-court line */}
          <line
            x1={VW / 2}
            x2={VW / 2}
            y1="1.5"
            y2={VH - 1.5}
            stroke="hsl(var(--court-line) / 0.32)"
            strokeWidth="0.25"
          />
          {/* Center jump circle */}
          <circle cx={VW / 2} cy={VH / 2} r="11" fill="none" stroke="hsl(var(--court-line) / 0.32)" strokeWidth="0.3" />
          <circle cx={VW / 2} cy={VH / 2} r="2.4" fill="none" stroke="hsl(var(--court-line) / 0.4)" strokeWidth="0.3" />
          {/* Three-point arcs */}
          <path
            d={`M 25 ${VH - 2} A 25 25 0 0 1 75 ${VH - 2}`}
            fill="none"
            stroke="hsl(var(--court-line) / 0.4)"
            strokeWidth="0.4"
          />
          <path d="M 25 2 A 25 25 0 0 0 75 2" fill="none" stroke="hsl(var(--court-line) / 0.4)" strokeWidth="0.4" />
          {/* Paint */}
          <rect x="38" y={VH - 24} width="24" height="22" fill="hsl(var(--court-line) / 0.05)" stroke="hsl(var(--court-line) / 0.3)" strokeWidth="0.32" />
          <rect x="38" y="2" width="24" height="22" fill="hsl(var(--court-line) / 0.04)" stroke="hsl(var(--court-line) / 0.22)" strokeWidth="0.32" />
          {/* Free-throw circles */}
          <circle cx="50" cy={VH - 24} r="8" fill="none" stroke="hsl(var(--court-line) / 0.3)" strokeWidth="0.3" />
          <circle cx="50" cy="24" r="8" fill="none" stroke="hsl(var(--court-line) / 0.2)" strokeWidth="0.3" />

          {/* Ambient — every shot in the corpus, faint, so the canvas reads as full of action. */}
          {posts.map((p) => {
            const focused = p.id === focusId;
            return (
              <motion.circle
                key={`bg-${p.id}`}
                cx={p.x}
                cy={p.y}
                r={focused ? 1.8 : 0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: focused ? 1 : 0.32 }}
                transition={{ duration: 0.5 }}
                fill={focused ? "hsl(var(--court-orange))" : "hsl(var(--court-line))"}
                stroke={focused ? "white" : "none"}
                strokeWidth={focused ? 0.4 : 0}
              />
            );
          })}

          {/* Chalk arcs from root → each ripple */}
          {focusPost
            ? ripplePositions.slice(0, progress).map(({ ev, x, y, arcId }, i) => {
                // Cubic bezier with chalk styling
                const ctrlX = (focusPost.x + x) / 2 + (i % 2 === 0 ? 8 : -8);
                const ctrlY = (focusPost.y + y) / 2 - 12;
                const d = `M ${focusPost.x} ${focusPost.y} Q ${ctrlX} ${ctrlY} ${x} ${y}`;
                return (
                  <g key={arcId}>
                    <path
                      d={d}
                      fill="none"
                      className="chalk-stroke animate-draw-in"
                      strokeWidth={0.5 + Math.min(0.6, (ev.value || 0) / 4000)}
                      style={{ ['--length' as never]: 80, animationDelay: `${i * 0.18}s` }}
                    />
                    {/* Subtle echo line beneath — sketchy double-stroke chalk feel */}
                    <path
                      d={d}
                      fill="none"
                      stroke="hsl(var(--court-line) / 0.22)"
                      strokeWidth="0.85"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })
            : null}

          {/* Focus shot — the root post, drawn loud */}
          {focusPost ? (
            <motion.g
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
            >
              <circle
                cx={focusPost.x}
                cy={focusPost.y}
                r="3.2"
                fill="hsl(var(--court-orange))"
                stroke="white"
                strokeWidth="0.45"
                filter="url(#cv-soft-glow)"
              />
              <circle cx={focusPost.x} cy={focusPost.y} r="6.5" fill="none" stroke="hsl(var(--court-orange) / 0.45)" strokeWidth="0.35" />
              <text
                x={focusPost.x}
                y={focusPost.y - 5}
                textAnchor="middle"
                className="fill-court-line"
                style={{ fontFamily: "var(--font-chalk), cursive", fontSize: "2.2px" }}
              >
                ROOT · {employeeMap[focusPost.employeeId]?.name?.split(" ")[0] ?? focusPost.platform}
              </text>
            </motion.g>
          ) : null}

          {/* Ripple endpoints — chalk dots with labels */}
          {visibleRipples.map((ev, i) => {
            const pos = ripplePositions[i];
            if (!pos) return null;
            const tone =
              ev.confidence === "Direct"
                ? "hsl(var(--confidence-direct))"
                : ev.confidence === "Estimated" || ev.confidence === "Modeled"
                  ? "hsl(var(--confidence-strong))"
                  : "hsl(var(--confidence-inferred))";
            return (
              <motion.g
                key={`ripple-${ev.id}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.16, type: "spring", stiffness: 260, damping: 20 }}
              >
                <circle cx={pos.x} cy={pos.y} r="2.2" fill={tone} stroke="white" strokeWidth="0.3" />
                <circle cx={pos.x} cy={pos.y} r="4" fill="none" stroke={tone} strokeOpacity="0.4" strokeWidth="0.3" />
                <text
                  x={pos.x}
                  y={pos.y - 4.5}
                  textAnchor="middle"
                  className="fill-court-line"
                  style={{ fontFamily: "var(--font-chalk), cursive", fontSize: "1.9px" }}
                >
                  {ev.eventType.split(" ").slice(0, 3).join(" ")}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 5.5}
                  textAnchor="middle"
                  className="fill-court-line/70"
                  style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "1.55px", letterSpacing: "0.06em" }}
                >
                  {ev.value ? `+${formatTicker(ev.value)}` : ev.platform.toUpperCase()}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Click-overlay: each post as a hit-target so users can re-focus the telestrator */}
        <div className="absolute inset-0">
          {posts.map((p) => (
            <button
              key={`hit-${p.id}`}
              type="button"
              onClick={() => handleSelect(p.id)}
              aria-label={`Focus on ${employeeMap[p.employeeId]?.name ?? p.platform} post`}
              className={cn(
                "absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full",
                "transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none",
                p.id === focusId && "bg-court-orange/10",
              )}
              style={{ left: `${p.x}%`, top: `${(p.y / VH) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Scrubber — halftime show timeline */}
      {total > 1 ? (
        <div className="mt-4 flex flex-col gap-2 px-1 sm:px-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
              Replay
            </span>
            <input
              type="range"
              min={1}
              max={total}
              step={1}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              aria-label="Telestrator replay scrubber"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-court-line/15 accent-court-orange"
            />
            <span className="font-mono text-eyebrow uppercase tracking-ticker text-foreground tabular">
              {progress}/{total}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setProgress(total)}
              className="h-7 px-3 font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground hover:text-foreground tabular"
            >
              End
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setProgress(1)}
              className="h-7 px-3 font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground hover:text-foreground tabular"
            >
              Start
            </Button>
          </div>

          {/* Chapter markers — the events themselves, dotted along the bar */}
          <div className="relative h-6">
            {focusRipples.map((ev, i) => {
              const left = total <= 1 ? 0 : (i / (total - 1)) * 100;
              const visible = i < progress;
              return (
                <div
                  key={`chapter-${ev.id}`}
                  className={cn(
                    "absolute -translate-x-1/2 transition-opacity",
                    visible ? "opacity-100" : "opacity-30",
                  )}
                  style={{ left: `${left}%` }}
                >
                  <div className="h-2 w-px bg-court-line/40" />
                  <div className="mt-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground tabular">
                    {ev.eventType.split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatTicker(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

/**
 * GameBreakerOverlay — the rare NBA Street Vol. 2 celebration.
 *
 * Used sparingly. Three escalating tiers (level 1/2/3). Holographic edge highlights,
 * brief screen-shake (subtle), spray-paint display type. Default state is calm.
 */
function GameBreakerOverlay({ level }: { level: 1 | 2 | 3 }) {
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    node.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: "translate3d(-2px, 1px, 0)" },
        { transform: "translate3d(2px, -1px, 0)" },
        { transform: "translate3d(-1px, 0, 0)" },
        { transform: "translate3d(0,0,0)" },
      ],
      { duration: 380, iterations: level },
    );
  }, [level]);

  const labels: Record<1 | 2 | 3, string> = {
    1: "Game Breaker 1",
    2: "Game Breaker 2",
    3: "Game Breaker 3",
  };

  return (
    <div ref={wrap} className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Holographic ring on the canvas border */}
      <div className="absolute inset-0 rounded-sm ring-1 ring-court-line/40" />
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          boxShadow: "inset 0 0 60px rgba(255,157,66,0.18), inset 0 0 120px rgba(85,167,255,0.12)",
        }}
      />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <div
          className={cn(
            "gamebreaker text-3xl sm:text-5xl holographic font-black",
            "drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]",
          )}
        >
          {labels[level]}
        </div>
        <div className="mt-1 text-right font-mono text-eyebrow uppercase tracking-ticker text-court-line/80 tabular">
          {level === 1
            ? "Viral threshold cleared"
            : level === 2
              ? "Teammate assist confirmed"
              : "Full chain conversion"}
        </div>
      </div>
    </div>
  );
}
