"use client";

import { MousePointerClick, Radio, Sparkles, Target, Users, WalletCards } from "lucide-react";

import { useFilters } from "@/components/AppShell";
import { InsightCard } from "@/components/InsightCard";
import { MetricCard } from "@/components/MetricCard";
import { OverviewCharts } from "@/components/OverviewCharts";
import { PlatformCard } from "@/components/PlatformCard";
import { filterPosts, platformCards, sumMetrics } from "@/lib/aggregations";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { posts } from "@/lib/mockData";

export default function OverviewPage() {
  const { filters } = useFilters();
  const filtered = filterPosts(posts, filters);
  const metrics = sumMetrics(filtered);
  const cards = platformCards(filtered);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Reach" value={formatNumber(metrics.reach)} icon={Radio} detail="Possessions across public surfaces" />
        <MetricCard label="Clicks" value={formatNumber(metrics.clicks)} icon={MousePointerClick} detail="Shot attempts and profile clicks" />
        <MetricCard label="Signups" value={formatNumber(metrics.signups)} icon={Target} detail="Made baskets into owned audience" accent="text-orange-300" />
        <MetricCard label="Paid Subs" value={formatNumber(metrics.paidSubscriptions)} icon={WalletCards} detail="Three-pointers from social demand" accent="text-orange-300" />
        <MetricCard label="Consulting" value={formatNumber(metrics.consultingLeads)} icon={Users} detail="And-one high-intent leads" accent="text-red-300" />
        <MetricCard label="Revenue" value={formatCurrency(metrics.revenue)} icon={Sparkles} detail="Modeled and direct influence" accent="text-red-300" />
      </section>

      <OverviewCharts posts={filtered} />

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <PlatformCard key={card.platform} {...card} />
          ))}
        </div>
        <div className="space-y-4">
          <InsightCard title="Film Room Thesis" kicker="Cultural Rule">
            This is not a leaderboard. The goal is not to make everyone shoot more; it is to understand where each
            person&apos;s best shot creates awareness, trust, conversion, and assists.
          </InsightCard>
          <InsightCard title="Mode-Sensitive Outcomes" kicker="Important UX">
            A hard CTA can miss on engagement and still score on signups. A personal product post can miss on direct
            conversion and still create hockey assists that make the next conversion easier.
          </InsightCard>
        </div>
      </section>
    </div>
  );
}
