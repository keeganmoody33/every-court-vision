import { HeatMapCourt } from "@/components/HeatMapCourt";
import { InsightCard } from "@/components/InsightCard";
import { filtersFromSearchParams, getPosts } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CourtHeatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const filtered = await getPosts(filters);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <p className="stat-label">Interactive Surface Map</p>
          <h2 className="text-2xl font-bold">Court Heat</h2>
        </div>
        <InsightCard title="Reading the Court">
          Toggle zone mode and scoring mode to see how the same surface changes shape by outcome: awareness,
          trust, signups, paid, consulting, revenue, or assists.
        </InsightCard>
      </div>
      <HeatMapCourt
        posts={filtered}
        zoneMode={filters.zoneMode}
        colorScale={filters.colorScale}
        scoringMode={filters.scoringMode}
      />
    </div>
  );
}
