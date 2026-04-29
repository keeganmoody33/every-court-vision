"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { scaleLinear } from "d3";
import { motion } from "framer-motion";

import { GamebreakerCallout, MiniHudChip } from "@/components/ArcadeChrome";
import { CourtCanvas } from "@/components/CourtCanvas";
import { StatTile } from "@/components/essay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modeValue, sumMetrics } from "@/lib/aggregations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { computeIntentMetrics } from "@/lib/intent/metrics";
import { OUT_OF_BOUNDS, PASS_LANES, SHOT_ZONES, type Rect } from "@/lib/intent/zones";
import type { ColorScale, IntentClass, Post, ScoringMode, ZoneMode } from "@/lib/types";

type RegionId = IntentClass | "turnover";

interface RegionSummary {
  id: RegionId;
  label: string;
  posts: Post[];
}

const REGION_LABELS: Record<RegionId, string> = {
  threePoint: "3P arc",
  midRange: "Mid elbows",
  paint: "Paint",
  freeThrow: "FT line",
  pass: "Pass lanes",
  turnover: "OOB rim",
};

function rectAttrs(rect: Rect) {
  return {
    x: rect.xMin,
    y: rect.yMin,
    width: rect.xMax - rect.xMin,
    height: rect.yMax - rect.yMin,
  };
}

function heatFill(scoringMode: ScoringMode, colorScale: ColorScale) {
  if (scoringMode === "Trust") return "hsl(var(--confidence-direct))";
  if (scoringMode === "Revenue") return "hsl(var(--court-red))";
  if (colorScale === "Traditional") return "hsl(var(--court-orange))";
  return "hsl(var(--court-orange))";
}

export function HeatMapCourt({
  posts,
  zoneMode,
  colorScale,
  scoringMode,
}: {
  posts: Post[];
  zoneMode: ZoneMode;
  colorScale: ColorScale;
  scoringMode: ScoringMode;
}) {
  const regions = useMemo<RegionSummary[]>(
    () =>
      ([
        "threePoint",
        "midRange",
        "paint",
        "freeThrow",
        "pass",
        "turnover",
      ] as RegionId[]).map((id) => ({
        id,
        label: REGION_LABELS[id],
        posts: posts.filter((post) => (id === "turnover" ? post.outcome === "turnover" : post.intentClass === id)),
      })),
    [posts],
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionId>("threePoint");
  const maxPosts = Math.max(1, ...regions.map((region) => region.posts.length));
  const opacityScale = scaleLinear().domain([0, maxPosts]).range([0.18, 0.92]);
  const selected = regions.find((region) => region.id === selectedRegion) ?? regions[0];
  const selectedMetrics = selected ? sumMetrics(selected.posts) : undefined;
  const selectedIntentMetrics = selected ? computeIntentMetrics(selected.posts, zoneMode === "Basic" ? 90 : 30) : undefined;
  const fill = heatFill(scoringMode, colorScale);
  const hottest = regions.reduce((best, region) => (region.posts.length > best.posts.length ? region : best), regions[0]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="border-court-orange/20 bg-black/35">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <MiniHudChip label="Mode" value={scoringMode} tone="orange" />
              <MiniHudChip label="Scale" value={colorScale} tone="teal" />
              <MiniHudChip label="Zones" value={zoneMode} tone="purple" />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3 py-2">
              <span className="size-2 rounded-full bg-court-orange shadow-orange-glow" />
              <span className="font-mono text-[10px] uppercase tracking-ticker-tight text-muted-foreground">
                Heat = volume. Panel = quality.
              </span>
            </div>
          </div>
          <CourtCanvas>
            <IntentRegionButton
              id="threePoint"
              label={REGION_LABELS.threePoint}
              selected={selectedRegion === "threePoint"}
              fill={fill}
              opacity={opacityScale(regions.find((region) => region.id === "threePoint")?.posts.length ?? 0)}
              onSelect={setSelectedRegion}
            >
              <path
                d="M 5 90 L 5 64 Q 50 52 95 64 L 95 90 L 77 90 Q 50 74 23 90 Z"
                fill={fill}
              />
            </IntentRegionButton>

            {Object.entries(SHOT_ZONES.midRange).map(([key, rect]) => (
              <IntentRegionButton
                key={key}
                id="midRange"
                label={REGION_LABELS.midRange}
                selected={selectedRegion === "midRange"}
                fill={fill}
                opacity={opacityScale(regions.find((region) => region.id === "midRange")?.posts.length ?? 0)}
                onSelect={setSelectedRegion}
              >
                <rect {...rectAttrs(rect)} rx="2" fill={fill} />
              </IntentRegionButton>
            ))}

            <IntentRegionButton
              id="paint"
              label={REGION_LABELS.paint}
              selected={selectedRegion === "paint"}
              fill={fill}
              opacity={opacityScale(regions.find((region) => region.id === "paint")?.posts.length ?? 0)}
              onSelect={setSelectedRegion}
            >
              <rect {...rectAttrs(SHOT_ZONES.paint)} rx="2" fill={fill} />
            </IntentRegionButton>

            <IntentRegionButton
              id="freeThrow"
              label={REGION_LABELS.freeThrow}
              selected={selectedRegion === "freeThrow"}
              fill={fill}
              opacity={opacityScale(regions.find((region) => region.id === "freeThrow")?.posts.length ?? 0)}
              onSelect={setSelectedRegion}
            >
              <rect {...rectAttrs(SHOT_ZONES.freeThrow)} rx="1" fill={fill} />
            </IntentRegionButton>

            {Object.entries(PASS_LANES).map(([lane, rect]) => (
              <rect
                key={lane}
                {...rectAttrs(rect)}
                rx="2"
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="0.35"
                strokeDasharray="1.4 1.2"
              />
            ))}

            {Object.entries(OUT_OF_BOUNDS).map(([rim, rect]) => {
              const turnoverCount = regions.find((region) => region.id === "turnover")?.posts.length ?? 0;
              return (
                <IntentRegionButton
                  key={rim}
                  id="turnover"
                  label={REGION_LABELS.turnover}
                  selected={selectedRegion === "turnover"}
                  fill="hsl(var(--muted-foreground))"
                  opacity={turnoverCount ? opacityScale(turnoverCount) : 0}
                  onSelect={setSelectedRegion}
                >
                  <rect {...rectAttrs(rect)} fill="hsl(var(--muted-foreground))" />
                </IntentRegionButton>
              );
            })}
          </CourtCanvas>
        </CardContent>
      </Card>

      <Card className="border-court-red/20 bg-white/[0.055]">
        <CardHeader>
          <p className="stat-label">Selected Region</p>
          <CardTitle>{selected?.label ?? "No region"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected && selectedMetrics && selectedIntentMetrics ? (
            <>
              <div className="grid gap-2">
                <StatTile label="Posts" value={formatNumber(selected.posts.length)} detail={`${zoneMode} read`} />
                <StatTile
                  label={scoringMode}
                  value={scoringMode === "Revenue" ? formatCurrency(modeValue(selectedMetrics, scoringMode)) : formatNumber(modeValue(selectedMetrics, scoringMode))}
                  detail={`${colorScale.toLowerCase()} heat scale`}
                />
                <StatTile label="FG%" value={formatPercent(selectedIntentMetrics.fgPct, 1)} detail="Made shots over attempts" />
                <StatTile label="Assists" value={formatNumber(selectedIntentMetrics.assistsCreated)} detail="Posts tagged as setup" />
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="stat-label">Read</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Heat is volume first. The selected scoring mode changes the readout; position stays anchored to
                  Phase 3a&apos;s intent mapping.
                </p>
              </div>
              {selected.id === hottest.id && selected.posts.length > 0 ? (
                <GamebreakerCallout
                  level={1}
                  label="Hot Zone Locked"
                  detail={`${selected.label} is carrying the most visible volume in this filter window.`}
                  active
                />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function IntentRegionButton({
  id,
  label,
  selected,
  fill,
  opacity,
  onSelect,
  children,
}: {
  id: RegionId;
  label: string;
  selected: boolean;
  fill: string;
  opacity: number;
  onSelect: (id: RegionId) => void;
  children: ReactNode;
}) {
  return (
    <motion.g
      role="button"
      tabIndex={0}
      aria-label={`Select ${label}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(id);
      }}
      className="cursor-pointer outline-none transition-opacity hover:opacity-90"
      style={{ opacity }}
    >
      <g
        fill={fill}
        fillOpacity={opacity}
        stroke={selected ? "white" : "rgba(255,255,255,0.24)"}
        strokeWidth={selected ? 0.8 : 0.35}
        filter={selected ? "url(#softGlow)" : undefined}
      >
        {children}
      </g>
    </motion.g>
  );
}
