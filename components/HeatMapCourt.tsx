"use client";

import { useMemo, useState } from "react";
import { scaleLinear } from "d3";
import { motion } from "framer-motion";

import { CourtCanvas } from "@/components/CourtCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { basicZones, modeAccent } from "@/lib/constants";
import { modeValue, zoneSummaries } from "@/lib/aggregations";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { ColorScale, Post, ScoringMode, ZoneMode } from "@/lib/types";

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
  const zones = useMemo(() => zoneSummaries(posts, zoneMode), [posts, zoneMode]);
  const [selectedZone, setSelectedZone] = useState(zones[0]?.zone ?? "X");
  const max = Math.max(1, ...zones.map((zone) => modeValue(zone.metrics, scoringMode)));
  const opacityScale = scaleLinear().domain([0, max]).range([0.22, 0.92]);

  const layouts =
    zoneMode === "Basic"
      ? basicZones
      : zones.map((zone, index) => ({
          id: zone.zone,
          label: zone.zone,
          x: 12 + (index % 4) * 22,
          y: 14 + Math.floor(index / 4) * 23,
          width: 18,
          height: 15,
        }));

  const selected = zones.find((zone) => zone.zone === selectedZone) ?? zones[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="border-white/10 bg-black/25">
        <CardContent className="p-4">
          <CourtCanvas>
            {layouts.map((layout) => {
              const summary = zones.find((zone) => zone.zone === layout.id || zone.zone === layout.label);
              const metricValue = summary ? modeValue(summary.metrics, scoringMode) : 0;
              const fill = heatColor(scoringMode, colorScale, metricValue);
              const active = selectedZone === (summary?.zone ?? layout.id);
              return (
                <motion.g
                  key={layout.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <rect
                    role="button"
                    tabIndex={0}
                    x={layout.x}
                    y={layout.y}
                    width={layout.width}
                    height={layout.height}
                    rx="2"
                    fill={fill}
                    fillOpacity={summary ? opacityScale(metricValue) : 0.18}
                    stroke={active ? modeAccent[scoringMode] : "rgba(255,255,255,0.22)"}
                    strokeWidth={active ? 0.9 : 0.35}
                    filter={active ? "url(#softGlow)" : undefined}
                    onClick={() => setSelectedZone(summary?.zone ?? layout.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setSelectedZone(summary?.zone ?? layout.id);
                    }}
                    className="cursor-pointer outline-none transition-opacity hover:opacity-90"
                  />
                  <text
                    x={layout.x + layout.width / 2}
                    y={layout.y + layout.height / 2 - 1}
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-[2.4px] font-semibold"
                  >
                    {layout.label.length > 18 ? `${layout.label.slice(0, 17)}...` : layout.label}
                  </text>
                  <text
                    x={layout.x + layout.width / 2}
                    y={layout.y + layout.height / 2 + 3.5}
                    textAnchor="middle"
                    className="pointer-events-none fill-white/70 text-[2.2px] font-mono"
                  >
                    {scoringMode === "Revenue" ? formatCurrency(metricValue) : formatNumber(metricValue)}
                  </text>
                </motion.g>
              );
            })}
          </CourtCanvas>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.045]">
        <CardHeader>
          <p className="stat-label">Selected Zone</p>
          <CardTitle>{selected?.zone ?? "No zone"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {selected ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Posts" value={String(selected.posts)} />
                <Mini label={scoringMode} value={scoringMode === "Revenue" ? formatCurrency(modeValue(selected.metrics, scoringMode)) : formatNumber(modeValue(selected.metrics, scoringMode))} />
                <Mini label="Social TS%" value={selected.socialTS.toFixed(1)} />
                <Mini label="Assist Rate" value={`${selected.assistRate.toFixed(1)}%`} />
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="stat-label">Best Use</p>
                <p className="mt-1 text-white">{selected.bestUse}</p>
              </div>
              <p className="text-muted-foreground">
                Color can mean different things by mode: blue leans awareness, purple trust and assists, orange
                conversion, red revenue and consulting, gray insufficient data.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function heatColor(mode: ScoringMode, scale: ColorScale, value: number) {
  if (value === 0) return "#6b7280";
  if (scale === "Traditional") return value > 1000 ? "#ff5a66" : value > 100 ? "#ff9d42" : "#3ee7d3";
  if (mode === "Awareness") return "#55a7ff";
  if (mode === "Trust" || mode === "Assists") return "#b78cff";
  if (mode === "Revenue" || mode === "Consulting Leads") return "#ff5a66";
  if (mode === "Signups" || mode === "Paid Subs") return "#ff9d42";
  return "#3ee7d3";
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="stat-label">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
