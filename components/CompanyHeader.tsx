import type { ComponentType } from "react";
import { ArrowUpRight, CircleDot, Network, Radio } from "lucide-react";

import { GamebreakerCallout, ScoreRail } from "@/components/ArcadeChrome";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { companyStats } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/formatters";

const profileStats = [
  ["Primary Court", "X"],
  ["Highest Intent Court", "LinkedIn"],
  ["Best Conversion Surface", "Newsletter"],
  ["Best Assist Motion", "Teammate Quote Posts"],
  ["Best Trust Motion", "Personal AI / Operator Posts"],
];

export function CompanyHeader() {
  const scoreRail = [
    { label: "Reach", value: formatNumber(companyStats.reach) },
    { label: "Clicks", value: formatNumber(companyStats.clicks) },
    { label: "Social TS", value: formatPercent(companyStats.socialTS) },
  ];

  return (
    <Card className="overflow-hidden border-court-orange/20 bg-[linear-gradient(135deg,rgba(255,157,66,0.12),rgba(255,255,255,0.03)_42%,rgba(0,0,0,0.28))]">
      <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1.05fr_1fr]">
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="blue">Company Profile</Badge>
              <Badge variant="purple">90-day film room</Badge>
              <Badge variant="outline">Assisted attribution</Badge>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <h1 className="gamebreaker text-5xl tracking-normal text-white sm:text-6xl md:text-7xl">EVERY</h1>
              <div className="pb-1 sm:pb-2">
                <p className="font-mono text-sm uppercase tracking-ticker-tight text-arcade-cyan">OFF-PLATFORM GROWTH IQ</p>
                <p className="text-sm text-muted-foreground">
                  NBA stats, arcade feedback, and growth analytics cockpit.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {profileStats.map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/10 bg-black/30 p-3 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]">
                <p className="stat-label">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <GamebreakerCallout
            level={2}
            label="Roster Heat Active"
            detail="The dashboard reads company, player, surface, and post layers without ranking teammates."
            active
          />
          <ScoreRail stats={scoreRail} tone="orange" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
            <HeaderStat icon={Radio} label="Reach" value={formatNumber(companyStats.reach)} />
            <HeaderStat icon={CircleDot} label="Engagements" value={formatNumber(companyStats.engagements)} />
            <HeaderStat icon={ArrowUpRight} label="Clicks" value={formatNumber(companyStats.clicks)} />
            <HeaderStat icon={Network} label="Assisted Conv." value={formatNumber(companyStats.assistedConversions)} />
            <HeaderStat label="Signups" value={formatNumber(companyStats.signups)} />
            <HeaderStat label="Paid Subs" value={formatNumber(companyStats.paidSubs)} />
            <HeaderStat label="Consulting Leads" value={formatNumber(companyStats.consultingLeads)} />
            <HeaderStat label="Social TS%" value={formatPercent(companyStats.socialTS)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function HeaderStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3 shadow-[inset_0_0_20px_rgba(43,202,166,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <p className="stat-label">{label}</p>
        {Icon ? <Icon className="size-4 text-arcade-cyan" /> : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
