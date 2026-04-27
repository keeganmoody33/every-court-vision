import type { ComponentType } from "react";
import { ArrowUpRight, CircleDot, Network, Radio } from "lucide-react";

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
  return (
    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))]">
      <div className="grid gap-5 p-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="blue">Company Profile</Badge>
              <Badge variant="purple">90-day film room</Badge>
              <Badge variant="outline">Assisted attribution</Badge>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <h1 className="text-4xl font-black tracking-normal text-white sm:text-5xl md:text-7xl">EVERY</h1>
              <div className="pb-1 sm:pb-2">
                <p className="font-mono text-sm text-primary">OFF-PLATFORM GROWTH IQ</p>
                <p className="text-sm text-muted-foreground">
                  NBA stats, ESPN film room, and growth analytics cockpit.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {profileStats.map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="stat-label">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

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
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="stat-label">{label}</p>
        {Icon ? <Icon className="size-4 text-primary" /> : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
