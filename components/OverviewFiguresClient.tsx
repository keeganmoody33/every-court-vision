"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber } from "@/lib/formatters";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--foreground) / 0.18)",
  borderRadius: 2,
  fontFamily: "var(--font-geist-mono), monospace",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  padding: "8px 10px",
};

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-geist-mono)" };

export function OverviewSurfaceChart({
  data,
}: {
  data: { platform: string; reach: number; signups: number; paid: number; consulting: number; assists: number }[];
}) {
  // Scope SVG gradient ids per-instance — global ids would collide if two of these
  // chart components mounted on the same page.
  const idBase = useId();
  const signupsGradient = `${idBase}-signups`;
  const reachGradient = `${idBase}-reach`;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 640, height: 320 }}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={signupsGradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#ff9d42" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#ff9d42" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={reachGradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#55a7ff" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#55a7ff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
        <XAxis
          dataKey="platform"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--foreground) / 0.12)" }}
          interval={0}
          angle={-15}
          height={48}
          textAnchor="end"
        />
        <YAxis
          tick={axisTick}
          tickFormatter={formatNumber}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--court-line) / 0.4)", strokeWidth: 1, strokeDasharray: "2 4" }} />
        <Area
          type="monotone"
          dataKey="reach"
          stroke="#55a7ff"
          fill={`url(#${reachGradient})`}
          strokeWidth={1.6}
          isAnimationActive
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="signups"
          stroke="#ff9d42"
          fill={`url(#${signupsGradient})`}
          strokeWidth={2.2}
          isAnimationActive
          animationDuration={1400}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OverviewRosterChart({
  data,
}: {
  data: { name: string; Trust: number; "Social TS": number; Assists: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 640, height: 320 }}>
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--foreground) / 0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--foreground) / 0.12)" }}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={42} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--court-line) / 0.05)" }} />
        <Bar dataKey="Trust" fill="#b78cff" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={1100} />
        <Bar dataKey="Social TS" fill="#3ee7d3" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={1100} />
        <Bar dataKey="Assists" fill="#ff9d42" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={1100} />
      </BarChart>
    </ResponsiveContainer>
  );
}
