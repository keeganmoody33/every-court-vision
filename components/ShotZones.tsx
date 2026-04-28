"use client";

import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zoneSummaries } from "@/lib/aggregations";
import type { Play, Post, ZoneMode } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/formatters";

export function ShotZones({ posts, zoneMode, playMap }: { posts: Post[]; zoneMode: ZoneMode; playMap: Record<string, Play> }) {
  const zones = zoneSummaries(posts, zoneMode).sort((a, b) => b.socialTS - a.socialTS);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {zones.map((zone) => {
        const play = playMap[zone.recommendedPlay];
        return (
          <Card key={zone.zone} className="border-white/10 bg-white/[0.045]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="stat-label">Zone</p>
                  <CardTitle className="mt-1">{zone.zone}</CardTitle>
                </div>
                <ArrowUpRight className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Mini label="Posts" value={formatNumber(zone.posts)} />
                <Mini label="Views" value={formatNumber(zone.metrics.views)} />
                <Mini label="Clicks" value={formatNumber(zone.metrics.clicks)} />
                <Mini label="Signups" value={formatNumber(zone.metrics.signups)} />
                <Mini label="Paid" value={formatNumber(zone.metrics.paidSubscriptions)} />
                <Mini label="Consulting" value={formatNumber(zone.metrics.consultingLeads)} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Mini label="Assist Rate" value={`${zone.assistRate.toFixed(1)}%`} />
                <Mini label="Social TS%" value={zone.socialTS.toFixed(1)} />
                <Mini label="Revenue" value={formatCurrency(zone.metrics.revenue)} />
                <Mini label="Best Use" value={zone.bestUse} />
              </div>
              <div className="rounded-md border border-orange-300/20 bg-orange-300/10 p-3">
                <p className="stat-label">Recommended Play</p>
                <p className="mt-1 text-sm font-semibold text-white">{play?.name ?? "Soft CTA After Trust Post"}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[62px] rounded-md border border-white/10 bg-black/20 p-2">
      <p className="stat-label">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
